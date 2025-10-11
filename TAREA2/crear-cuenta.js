import { Keypair } from '@stellar/stellar-sdk';

async function crearMultiplesCuentas() {
  // Array vacío donde guardo la información de  las cuentas que voy creando
  const cuentas = [];
  
  console.log('🚀 Iniciando creación de 5 cuentas Stellar...\n');
  console.log('='.repeat(60));
  
  // Bucle for que se ejecuta 5 veces (i va de 1 hasta 5)
  for (let i = 1; i <= 5; i++) {
    console.log(`\n📝 Creando cuenta ${i}/5...`);
    console.log('-'.repeat(60));
    
    // PASO 1: Generar un nuevo par de llaves (pública y secreta) de forma aleatoria
    const pair = Keypair.random();
    
    // Mostrar en consola que las llaves fueron generadas exitosamente
    console.log('✅ ¡Par de llaves generado!\n');
    
    // Mostrar la PUBLIC KEY (esta se puede compartir)
    console.log('📧 PUBLIC KEY (puedes compartir):');
    console.log(pair.publicKey());
    
    // Mostrar la SECRET KEY (esta NO compartir))
  
    // PASO 2: Crear un objeto con toda la información de cada cuenta
    // Este objeto guardo en el array para tener un registro
    const infoCuenta = {
      numero: i,                        // Número de cuenta (1, 2, 3, 4, 5)
      publicKey: pair.publicKey(),      // Llave pública
      secretKey: pair.secret(),         // Llave secreta
      balance: 0,                       // Balance inicial en 0 (se actualiza después)
      hash: null,                       // Hash de la transacción (se actualiza después)
      fondeada: false                   // Estado inicial: no fondeada
    };
    
    // PASO 3: Fondear la cuenta con Friendbot
    console.log('\n💰 Fondeando con Friendbot...');
    
    // Try-catch para manejar errores en caso de que falle la petición
    try {
      // Hacer una petición HTTP a Friendbot pasándole la public key
      // Friendbot nos va a dar 10,000 XLM de prueba
      const response = await fetch(
        `https://friendbot.stellar.org/?addr=${pair.publicKey()}`
      );
      
      // Convertir la respuesta a JSON para poder leerla
      const result = await response.json();
      
      // Verificar si la petición fue exitosa
      if (result.successful || response.ok) {
        // Actualizar la información de la cuenta con los datos del fondeo
        infoCuenta.balance = 10000;        // Balance de 10,000 XLM
        infoCuenta.hash = result.hash;     // Hash de la transacción
        infoCuenta.fondeada = true;        // Marcar como fondeada exitosamente
        
        // Mostrar en consola que la cuenta fue fondeada
        console.log('✅ ¡Cuenta fondeada con 10,000 XLM!');
        console.log('💵 Balance inicial: 10,000 XLM');
        console.log('🔗 Transaction hash:', result.hash);
      } else {
        // Si la respuesta no fue exitosa, mostrar advertencia
        console.log('⚠️  No se pudo fondear la cuenta');
      }
    } catch (error) {
      // Si hay algún error (red, servidor caído, etc.), mostrarlo
      console.error('❌ Error al fondear:', error.message);
    }
    
    // PASO 4: Agregar la cuenta completa al array de cuentas
    cuentas.push(infoCuenta);
    
  
  }
  
  // PASO 5: Mostrar un resumen final con todas las cuentas creadas
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE CUENTAS CREADAS');
  console.log('='.repeat(60));
  
  // Recorrer el array de cuentas y mostrar la información de cada una
  cuentas.forEach((cuenta, index) => {
    console.log(`\n🏦 Cuenta ${cuenta.numero}:`);
    console.log(`   Public Key: ${cuenta.publicKey}`);
    console.log(`   Secret Key: ${cuenta.secretKey}`);
    console.log(`   Balance: ${cuenta.balance} XLM`);
    // Operador ternario: si fondeada es true, muestra ✅, sino muestra ❌
    console.log(`   Estado: ${cuenta.fondeada ? '✅ Fondeada' : '❌ No fondeada'}`);
    // Solo mostrar el hash si existe (si la cuenta fue fondeada)
    if (cuenta.hash) {
      console.log(`   Hash: ${cuenta.hash}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  IMPORTANTE: Guarda estas llaves en un lugar seguro');
  console.log('='.repeat(60));
  
  // Retornar el array completo por si necesitas usarlo después
  return cuentas;
}

// Llamar a la función para ejecutar todo el proceso
crearMultiplesCuentas();

// INSTRUCCIONES DE EJECUCIÓN:
// 1. Ejecutar con: node crear-cuenta.js
// 2. Asegúrate de tener "type": "module" en tu package.json
