import dotenv from 'dotenv';
dotenv.config();
import {
  Horizon, 
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  Memo
} from '@stellar/stellar-sdk';

// IMPORTAMOS todo lo necesario desde el SDK de Stellar:
// - Horizon: Para conectarnos a la red de Stellar
// - Keypair: Para manejar las llaves públicas y privadas
// - TransactionBuilder: Para construir transacciones
// - Networks: Para especificar si usamos testnet o mainnet
// - Operation: Para definir operaciones (como pagos)
// - Asset: Para definir qué activo enviamos (XLM u otros)
// - BASE_FEE: La comisión base de Stellar
// - Memo: Para agregar notas a las transacciones

// Configuración de la red: conectamos con el servidor de testnet
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

// PASO 1: Cargar la cuenta fuente (la mia)
    // fromSecret() convierte mi SECRET_KEY en un objeto Keypair
    const SECRET_KEY = process.env.SECRET_KEY_1;

    // Validar que la SECRET_KEY exista
    if (!SECRET_KEY) {
      console.error('❌ ERROR: SECRET_KEY_1 no está definida en el archivo .env');
      console.log('💡 Asegúrate de:');
      console.log('   1. Tener un archivo .env en la raíz del proyecto');
      console.log('   2. Que contenga: SECRET_KEY_1=TU_SECRET_KEY');
      process.exit(1);
    }

// Array con los destinatarios: cada uno tiene su public key y un memo único
const destinatarios = [
  { publicKey: "GBVUFAIES6NJPSV5QOXLE7ZQOQANH6JT7F5IVA4NRXG64D73N7GSZOMO", memo: "Pago 1!!" },  // Primer destinatario
  { publicKey: "GAW3INSMXYEP2FR3BHEPLRVCELIOYZ6KLXRJL6SQI4QCBZ4NVSB2XF6A", memo: "Pago 2!!" },  // Segundo destinatario
  { publicKey: "GBLONI3TVYIKZNDSMWHMXBM4ATSVOA7225BRV6T6BFTL3AQ6RDOCOKDA", memo: "Pago 3!!" }   // Tercer destinatario
];

// Función asíncrona que envía un pago individual
// Recibe: la cantidad (amount), el destino (destination) y el memo
async function enviarPago(amount, destination, memo = '') {
  try {
    console.log(`\n💸 Enviando ${amount} XLM a ${destination.substring(0, 8)}...`);
    console.log(`📝 Memo: ${memo}`);
    
    
    const sourceKeys = Keypair.fromSecret(SECRET_KEY);
    
    // loadAccount() obtiene información actualizada de mi cuenta desde la blockchain
    // Necesitamos esto para conocer el sequence number (número de secuencia)
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    // Mostrar el balance actual de XLM (está en la posición 0 del array de balances)
    console.log(`💰 Balance actual: ${sourceAccount.balances[0].balance} XLM`);
    
    // PASO 2: Construir la transacción
    // TransactionBuilder es como un constructor de transacciones paso a paso
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,                    // Comisión fija de Stellar (100 stroops = 0.00001 XLM)
      networkPassphrase: networkPassphrase  // Identificador de la red (testnet en este caso)
    })
      // Agregar la operación de pago
      .addOperation(Operation.payment({
        destination: destination,        // A quién le enviamos
        asset: Asset.native(),          // Asset.native() = XLM (la moneda nativa)
        amount: amount.toString()       // Cantidad a enviar (debe ser string)
      }))
      // Agregar un memo (nota) a la transacción
      .addMemo(memo ? Memo.text(memo) : Memo.none())  // Si hay memo lo agrega, sino pone "none"
      // Timeout: si no se confirma en 30 segundos, la transacción expira
      .setTimeout(30)
      // build() construye la transacción completa lista para firmar
      .build();
    
    // PASO 3: Firmar la transacción con mi secret key
    // Esto es como poner mi "firma digital" para autorizar el pago
    transaction.sign(sourceKeys);
    
    // PASO 4: Enviar la transacción a la red de Stellar
    // submitTransaction() envía la transacción firmada al servidor
    // await espera a que el servidor procese y confirme la transacción
    const result = await server.submitTransaction(transaction);
    
    // Si llegamos aquí, el pago fue exitoso
    console.log('✅ ¡PAGO EXITOSO!');
    console.log(`🔗 Hash: ${result.hash}`);
    console.log(`📊 Ledger: ${result.ledger}`);  // Número del ledger donde se guardó
    
    // Retornar el resultado completo por si lo necesitamos después
    return result;
    
  } catch (error) {
    // Si algo sale mal, capturamos el error y lo mostramos
    console.error('❌ ERROR en el pago:', error.message);
    // Re-lanzamos el error para que se detenga el proceso
    throw error;
  }
}

// Función principal que envía pagos a múltiples destinos
async function enviarPagosMultiples() {
  console.log('🚀 SISTEMA DE PAGOS AUTOMATIZADO');
  console.log('='.repeat(60));
  console.log(`📋 Total de pagos a realizar: ${destinatarios.length}`);
  console.log(`💵 Monto por pago: 2 XLM`);
  console.log(`💰 Total a enviar: ${destinatarios.length * 2} XLM`);
  console.log('='.repeat(60));
  
  // Array para guardar los resultados de cada transacción
  const resultados = [];
  
  // Contador para saber cuántos pagos van exitosos
  let pagosExitosos = 0;
  
  // BUCLE: Recorrer cada destinatario y enviarle su pago
  for (let i = 0; i < destinatarios.length; i++) {
    const destinatario = destinatarios[i];
    
    console.log(`\n📤 Procesando pago ${i + 1}/${destinatarios.length}...`);
    console.log('-'.repeat(60));
    
    try {
      // Enviar 2 XLM a este destinatario con su memo único
      const resultado = await enviarPago(
        '2',                          // Cantidad: 2 XLM
        destinatario.publicKey,       // Destino: la public key del destinatario
        destinatario.memo             // Memo único de identificación
      );
      
      // Guardar el resultado en el array
      resultados.push({
        numero: i + 1,
        destinatario: destinatario.publicKey,
        memo: destinatario.memo,
        hash: resultado.hash,
        exitoso: true,
        ledger: resultado.ledger
      });
      
      // Incrementar el contador de pagos exitosos
      pagosExitosos++;
      
      // Esperar 1 segundo antes del siguiente pago
      // Esto evita saturar la red y da tiempo para confirmar cada transacción
      if (i < destinatarios.length - 1) {
        console.log('\n⏳ Esperando 1 segundo antes del siguiente pago...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      // Si este pago falla, lo registramos pero NO detenemos el proceso
      console.error(`❌ Pago ${i + 1} FALLÓ`);
      
      resultados.push({
        numero: i + 1,
        destinatario: destinatario.publicKey,
        memo: destinatario.memo,
        exitoso: false,
        error: error.message
      });
    }
  }
  
  // RESUMEN FINAL: Mostrar un resumen de todos los pagos realizados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PAGOS');
  console.log('='.repeat(60));
  console.log(`✅ Pagos exitosos: ${pagosExitosos}/${destinatarios.length}`);
  console.log(`❌ Pagos fallidos: ${destinatarios.length - pagosExitosos}/${destinatarios.length}`);
  console.log('='.repeat(60));
  
  // Mostrar detalle de cada pago
  resultados.forEach((resultado) => {
    console.log(`\n💳 Pago ${resultado.numero}:`);
    console.log(`   Destinatario: ${resultado.destinatario.substring(0, 10)}...`);
    console.log(`   Memo: ${resultado.memo}`);
    
    if (resultado.exitoso) {
      console.log(`   Estado: ✅ Exitoso`);
      console.log(`   Hash: ${resultado.hash}`);
      console.log(`   Ledger: ${resultado.ledger}`);
    } else {
      console.log(`   Estado: ❌ Fallido`);
      console.log(`   Error: ${resultado.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Proceso completado');
  console.log('='.repeat(60));
  
  // Retornar todos los resultados
  return resultados;
}

// EJECUTAR el sistema de pagos múltiples
enviarPagosMultiples();

// INSTRUCCIONES PARA EJECUTAR:
// 1. Reemplaza SECRET_KEY con tu secret key real
// 2. Reemplaza las public keys en el array destinatarios con cuentas reales
// 3. Asegúrate de tener suficiente balance (al menos 6 XLM + fees)
// 4. Ejecuta con: node enviar-pago.js
// 5. Recuerda tener "type": "module" en tu package.json