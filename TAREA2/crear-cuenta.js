// Importar dotenv al inicio del archivo (ANTES de cualquier otra cosa)
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

// Configuración de la red usando variables de entorno
const server = new Horizon.Server(process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

// ✅ AHORA las secret keys vienen del archivo .env (SEGURO)
// ❌ ANTES estaban hardcodeadas en el código (INSEGURO)
const SECRET_KEY = process.env.SECRET_KEY_1;

// Array de destinatarios (puedes usar las public keys del .env también)
const destinatarios = [
  { publicKey: process.env.PUBLIC_KEY_2, memo: "Pago-001" },
  { publicKey: process.env.PUBLIC_KEY_3, memo: "Pago-002" },
  { publicKey: "GBXXX...otra", memo: "Pago-003" }
];

// Validar que las variables de entorno existan
if (!SECRET_KEY) {
  console.error('❌ ERROR: SECRET_KEY_1 no está definida en el archivo .env');
  process.exit(1);
}

// Función para enviar un pago individual
async function enviarPago(amount, destination, memo = '') {
  try {
    console.log(`\n💸 Enviando ${amount} XLM a ${destination.substring(0, 8)}...`);
    console.log(`📝 Memo: ${memo}`);
    
    // Cargar la cuenta fuente desde la SECRET_KEY del .env
    const sourceKeys = Keypair.fromSecret(SECRET_KEY);
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    console.log(`💰 Balance actual: ${sourceAccount.balances[0].balance} XLM`);
    
    // Construir la transacción
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(Operation.payment({
        destination: destination,
        asset: Asset.native(),
        amount: amount.toString()
      }))
      .addMemo(memo ? Memo.text(memo) : Memo.none())
      .setTimeout(30)
      .build();
    
    // Firmar la transacción
    transaction.sign(sourceKeys);
    
    // Enviar la transacción
    const result = await server.submitTransaction(transaction);
    
    console.log('✅ ¡PAGO EXITOSO!');
    console.log(`🔗 Hash: ${result.hash}`);
    console.log(`📊 Ledger: ${result.ledger}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR en el pago:', error.message);
    throw error;
  }
}

// Función principal
async function enviarPagosMultiples() {
  console.log('🚀 SISTEMA DE PAGOS AUTOMATIZADO');
  console.log('='.repeat(60));
  console.log(`📋 Total de pagos a realizar: ${destinatarios.length}`);
  console.log(`💵 Monto por pago: 2 XLM`);
  console.log(`💰 Total a enviar: ${destinatarios.length * 2} XLM`);
  console.log('='.repeat(60));
  
  const resultados = [];
  let pagosExitosos = 0;
  
  for (let i = 0; i < destinatarios.length; i++) {
    const destinatario = destinatarios[i];
    
    console.log(`\n📤 Procesando pago ${i + 1}/${destinatarios.length}...`);
    console.log('-'.repeat(60));
    
    try {
      const resultado = await enviarPago(
        '2',
        destinatario.publicKey,
        destinatario.memo
      );
      
      resultados.push({
        numero: i + 1,
        destinatario: destinatario.publicKey,
        memo: destinatario.memo,
        hash: resultado.hash,
        exitoso: true,
        ledger: resultado.ledger
      });
      
      pagosExitosos++;
      
      if (i < destinatarios.length - 1) {
        console.log('\n⏳ Esperando 1 segundo antes del siguiente pago...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
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
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PAGOS');
  console.log('='.repeat(60));
  console.log(`✅ Pagos exitosos: ${pagosExitosos}/${destinatarios.length}`);
  console.log(`❌ Pagos fallidos: ${destinatarios.length - pagosExitosos}/${destinatarios.length}`);
  console.log('='.repeat(60));
  
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
  
  return resultados;
}

// Ejecutar
enviarPagosMultiples();