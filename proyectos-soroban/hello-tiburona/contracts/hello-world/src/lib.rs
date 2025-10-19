#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ContadorSaludos,
    UltimoSaludo(Address),
    // 🎯 RETO 1: Contador por usuario
    ContadorPorUsuario(Address),
    // 🎯 RETO 3: Límite configurable
    LimiteCaracteres,
}

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NoInicializado);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ContadorSaludos, &0u32);

        // 🎯 RETO 3: Inicializar límite por defecto (32 caracteres)
        env.storage()
            .instance()
            .set(&DataKey::LimiteCaracteres, &32u32);

        env.storage().instance().extend_ttl(100, 100);

        Ok(())
    }

    pub fn hello(env: Env, usuario: Address, nombre: Symbol) -> Result<Symbol, Error> {
        // Verificar que el contrato esté inicializado
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NoInicializado);
        }
        // ✅ PASO 4.2: Validación - Nombre no vacío
        let nombre_str = nombre.to_string();
        if nombre_str.len() == 0 {
            return Err(Error::NombreVacio);
        }

        // ✅ PASO 4.3: Validación - Nombre no muy largo
        // Usar el límite configurable (Reto 3)
        let limite: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LimiteCaracteres)
            .unwrap_or(32);

        if nombre_str.len() > limite as usize {
            return Err(Error::NombreMuyLargo);
        }

        // ✅ PASO 4.4: Incrementar contador global
        let key_contador = DataKey::ContadorSaludos;
        let contador: u32 = env.storage().instance().get(&key_contador).unwrap_or(0);
        env.storage().instance().set(&key_contador, &(contador + 1));

        // 🎯 RETO 1: Incrementar contador por usuario
        let key_contador_usuario = DataKey::ContadorPorUsuario(usuario.clone());
        let contador_usuario: u32 = env
            .storage()
            .persistent()
            .get(&key_contador_usuario)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key_contador_usuario, &(contador_usuario + 1));
        env.storage()
            .persistent()
            .extend_ttl(&key_contador_usuario, 100, 100);

        // ✅ PASO 4.5: Guardar último saludo
        env.storage()
            .persistent()
            .set(&DataKey::UltimoSaludo(usuario.clone()), &nombre);

        // ✅ PASO 4.6: Extender TTL
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::UltimoSaludo(usuario), 100, 100);

        env.storage().instance().extend_ttl(100, 100);

        // ✅ PASO 4.7: Retornar saludo
        Ok(Symbol::new(&env, "Hola"))
    }

    pub fn get_contador(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ContadorSaludos)
            .unwrap_or(0)
    }

    pub fn get_ultimo_saludo(env: Env, usuario: Address) -> Option<Symbol> {
        env.storage()
            .persistent()
            .get(&DataKey::UltimoSaludo(usuario))
    }

    pub fn reset_contador(env: Env, caller: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }
        env.storage()
            .instance()
            .set(&DataKey::ContadorSaludos, &0u32);

        Ok(())
    }

    // 🎯 RETO 1: Obtener contador por usuario
    pub fn get_contador_usuario(env: Env, usuario: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::ContadorPorUsuario(usuario))
            .unwrap_or(0)
    }

    // 🎯 RETO 2: Transferir admin
    pub fn transfer_admin(env: Env, caller: Address, nuevo_admin: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }

        env.storage().instance().set(&DataKey::Admin, &nuevo_admin);
        env.storage().instance().extend_ttl(100, 100);

        Ok(())
    }

    // 🎯 RETO 3: Establecer límite de caracteres
    pub fn set_limite(env: Env, caller: Address, limite: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NoInicializado)?;

        if caller != admin {
            return Err(Error::NoAutorizado);
        }

        env.storage()
            .instance()
            .set(&DataKey::LimiteCaracteres, &limite);
        env.storage().instance().extend_ttl(100, 100);

        Ok(())
    }

    // 🎯 RETO 3: Obtener límite actual
    pub fn get_limite(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::LimiteCaracteres)
            .unwrap_or(32)
    }
}

#[cfg(test)]
mod test;

//Reflexión de la implementación:

// Lo que más me costó entender y por qué:
//Entender el flujo completo de validaciones antes de modificar storage.
//Al principio quería incrementar el contador antes de validar el nombre,
//pero me di cuenta que eso podría dejar el estado inconsistente si la
//validación fallaba después.

//¿Qué aprendí que no esperaba?
//Que el operador `?` realmente ayuda  a escribir código más limpio
//y fácil de seguir. También aprendí la importancia
//de validar ANTES de tocar storage (principio "fail fast").

//¿Qué aplicaría en mis propios proyectos?
//El patrón de validación exhaustiva antes de cualquier operación de
//storage. También la estructura de tests con casos positivos y negativos
