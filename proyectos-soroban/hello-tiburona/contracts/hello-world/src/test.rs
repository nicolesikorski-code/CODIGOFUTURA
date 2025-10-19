#![cfg(test)]
mod test {
    use crate::*;
    use soroban_sdk::{testutils::Address as _, Env};

    // ✅ FASE 7: Tests básicos requeridos
    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);
        assert_eq!(client.get_contador(), 0);
        assert_eq!(client.get_limite(), 32); // Reto 3
    }

    #[test]
    fn test_no_reinicializar() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);
        
        let resultado = client.try_initialize(&admin);
        assert!(resultado.is_err());
    }

    #[test]
    fn test_hello_exitoso() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin);

        let nombre = Symbol::new(&env, "Ana");
        let resultado = client.hello(&usuario, &nombre);

        assert_eq!(resultado, Symbol::new(&env, "Hola"));
        assert_eq!(client.get_contador(), 1);
        assert_eq!(client.get_ultimo_saludo(&usuario), Some(nombre));
    }

    // ✅ PASO 7.4: Test nombre vacío (FALTABA)
    #[test]
    fn test_nombre_vacio() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin);

        let vacio = Symbol::new(&env, "");
        let resultado = client.try_hello(&usuario, &vacio);
        assert!(resultado.is_err());
    }

    // ✅ Test nombre muy largo (debería agregarse)
    #[test]
    fn test_nombre_muy_largo() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin);

        // Crear un nombre de 33 caracteres (más largo que el límite de 32)
        let largo = Symbol::new(&env, "NombreMuyLargoQueExcedeLimite123");
        let resultado = client.try_hello(&usuario, &largo);
        assert!(resultado.is_err());
    }

    #[test]
    fn test_reset_solo_admin() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin);

        client.hello(&usuario, &Symbol::new(&env, "Test"));
        assert_eq!(client.get_contador(), 1);

        client.reset_contador(&admin);
        assert_eq!(client.get_contador(), 0);
    }

    #[test]
    fn test_reset_no_autorizado() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let otro = Address::generate(&env);

        client.initialize(&admin);

        let resultado = client.try_reset_contador(&otro);
        assert!(resultado.is_err());
    }

    // 🎯 RETO 1: Test contador por usuario
    #[test]
    fn test_contador_por_usuario() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario1 = Address::generate(&env);
        let usuario2 = Address::generate(&env);

        client.initialize(&admin);

        // Usuario 1 saluda 3 veces
        client.hello(&usuario1, &Symbol::new(&env, "Ana"));
        client.hello(&usuario1, &Symbol::new(&env, "Ana"));
        client.hello(&usuario1, &Symbol::new(&env, "Ana"));

        // Usuario 2 saluda 1 vez
        client.hello(&usuario2, &Symbol::new(&env, "Bob"));

        // Verificar contadores individuales
        assert_eq!(client.get_contador_usuario(&usuario1), 3);
        assert_eq!(client.get_contador_usuario(&usuario2), 1);

        // Verificar contador global
        assert_eq!(client.get_contador(), 4);
    }

    // 🎯 RETO 2: Test transfer admin
    #[test]
    fn test_transfer_admin() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin1 = Address::generate(&env);
        let admin2 = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin1);

        // Admin1 puede resetear
        client.hello(&usuario, &Symbol::new(&env, "Test"));
        client.reset_contador(&admin1);
        assert_eq!(client.get_contador(), 0);

        // Admin1 transfiere a Admin2
        client.transfer_admin(&admin1, &admin2);

        // Admin1 ya no puede resetear
        client.hello(&usuario, &Symbol::new(&env, "Test"));
        let resultado = client.try_reset_contador(&admin1);
        assert!(resultado.is_err());

        // Admin2 sí puede resetear
        client.reset_contador(&admin2);
        assert_eq!(client.get_contador(), 0);
    }

    // 🎯 RETO 3: Test límite configurable
    #[test]
    fn test_set_limite() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let otro = Address::generate(&env);

        client.initialize(&admin);

        // Límite inicial debe ser 32
        assert_eq!(client.get_limite(), 32);

        // Admin puede cambiar el límite
        client.set_limite(&admin, &50);
        assert_eq!(client.get_limite(), 50);

        // Otro usuario no puede cambiar el límite
        let resultado = client.try_set_limite(&otro, &100);
        assert!(resultado.is_err());
    }

    // 🎯 BONUS: Test que el límite se aplica correctamente en hello()
    #[test]
    fn test_limite_dinamico_en_hello() {
        let env = Env::default();
        let contract_id = env.register(HelloContract, ());
        let client = HelloContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usuario = Address::generate(&env);

        client.initialize(&admin);

        // Con límite de 32, un nombre de 10 caracteres funciona
        let nombre_corto = Symbol::new(&env, "NombreOK");
        let resultado = client.hello(&usuario, &nombre_corto);
        assert_eq!(resultado, Symbol::new(&env, "Hola"));

        // Cambiar límite a 5
        client.set_limite(&admin, &5);

        // Ahora un nombre de 10 caracteres falla
        let resultado = client.try_hello(&usuario, &nombre_corto);
        assert!(resultado.is_err());

        // Pero uno de 4 caracteres funciona
        let nombre_muy_corto = Symbol::new(&env, "Ana");
        let resultado = client.hello(&usuario, &nombre_muy_corto);
        assert_eq!(resultado, Symbol::new(&env, "Hola"));
    }
}