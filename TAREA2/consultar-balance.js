import { Horizon } from '@stellar/stellar-sdk';

// Configuración del servidor de Stellar Testnet
// Horizon es la API que nos permite comunicarnos con la blockchain de Stellar
const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Array de public keys a monitorear
// Puedes agregar todas las cuentas que quieras consultar
const PUBLIC_KEYS = [
  'GCABMOG774QY3ONRFH7CC6ZYI2UUHY5VJK6FYVA2CHX3ZOHS6BYYYUI7',  // Primera cuenta a monitorear
  'GCJU5CA7IZVLZDCKCLFCRYRN66C6WL6ALRC4J2VKXDUEB3722ZYNAOQJ',  // Segunda cuenta a monitorear
  'GDAONWCDPX5JEFLECHHY7V7WGWT6CXRDPIRF3FEMEZXKQYUATV6UQLSM'   // Tercera cuenta a monitorear
];

// Función que consulta el balance de UNA cuenta específica
// Recibe como parámetro la public key de la cuenta a consultar
async function consultarBalance(publicKey) {
  try {
    console.log(`🔍 Consultando cuenta: ${publicKey.substring(0, 8)}...\n`);
    
    // PASO 1: Cargar la información de la cuenta desde la blockchain
    // loadAccount() hace una petición al servidor y trae todos los datos
    const account = await server.loadAccount(publicKey);
    
    // PASO 2: Mostrar información básica de la cuenta
    console.log('╔═══════════════════════════════════╗');
    console.log('📊 INFORMACIÓN DE CUENTA');
    console.log('╚═══════════════════════════════════╝\n');
    
    // Account ID es la public key de la cuenta
    console.log(`📧 Account ID:`);
    console.log(`   ${account.id}\n`);
    
    // Sequence Number: es un contador que incrementa con cada transacción
    // Se usa para evitar transacciones duplicadas
    console.log(`🔢 Sequence Number:`);
    console.log(`   ${account.sequenceNumber()}\n`);
    
    // PASO 3: Mostrar información de balances
    console.log('╔═══════════════════════════════════╗');
    console.log('💰 BALANCES');
    console.log('╚═══════════════════════════════════╝\n');
    
    // account.balances es un ARRAY que contiene todos los activos que tiene la cuenta
    // Puede tener XLM (nativo) y otros tokens personalizados
    account.balances.forEach((balance, index) => {
      // Verificar si es XLM (el activo nativo de Stellar)
      if (balance.asset_type === 'native') {
        console.log(`${index + 1}. 🌟 XLM (Lumens):`);
        console.log(`   Total: ${balance.balance} XLM`);
        
        // CÁLCULO DE RESERVAS:
        // Stellar requiere que las cuentas mantengan un balance mínimo bloqueado
        
        // Reserva base: 0.5 XLM por existir la cuenta
        const baseReserve = 0.5;
        
        // Reserva por subentradas: 0.5 XLM por cada trustline, oferta, etc.
        // subentry_count es el número total de "cosas" que tiene la cuenta
        // (trustlines, offers, signers adicionales, data entries)
        const subentryReserve = account.subentry_count * 0.5;
        
        // Reserva total bloqueada
        const totalReserve = baseReserve + subentryReserve;
        
        // Balance disponible = Balance total - Reservas bloqueadas
        const available = parseFloat(balance.balance) - totalReserve;
        
        console.log(`   Bloqueado: ${totalReserve.toFixed(7)} XLM`);
        console.log(`   Disponible: ${available.toFixed(7)} XLM\n`);
      } else {
        // Si NO es XLM, es otro token personalizado
        console.log(`${index + 1}. 🪙 ${balance.asset_code}:`);
        console.log(`   Balance: ${balance.balance}`);
        // asset_issuer es la cuenta que creó/emitió este token
        console.log(`   Emisor: ${balance.asset_issuer.substring(0, 8)}...\n`);
      }
    });
    
    // Retornar el objeto account completo por si lo necesitamos después
    return account;
    
  } catch (error) {
    // Manejo de errores específicos
    
    // Error 404 = La cuenta no existe en la blockchain
    if (error.response && error.response.status === 404) {
      console.error('❌ Cuenta no encontrada');
      console.log('💡 Posibles causas:');
      console.log('   - La cuenta nunca fue creada/fondeada');
      console.log('   - Error de tipeo en la public key\n');
    } else {
      // Otro tipo de error (red, servidor caído, etc.)
      console.error('❌ Error:', error.message);
    }
    
    // Re-lanzar el error para que la función superior lo maneje
    throw error;
  }
}

// FUNCIÓN PRINCIPAL: Monitor de múltiples cuentas
async function monitorearCuentas(publicKeys) {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('         🖥️  MONITOR DE CUENTAS STELLAR');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log(`📋 Total de cuentas a consultar: ${publicKeys.length}`);
  console.log(`⏰ Fecha de consulta: ${new Date().toLocaleString('es-AR')}`);
  console.log('═'.repeat(60) + '\n');
  
  // Array para guardar los resultados de todas las cuentas
  const resultados = [];
  
  // Contadores para estadísticas
  let cuentasExitosas = 0;
  let cuentasFallidas = 0;
  
  // BUCLE: Consultar cada cuenta una por una
  for (let i = 0; i < publicKeys.length; i++) {
    const publicKey = publicKeys[i];
    
    console.log(`\n${'▼'.repeat(60)}`);
    console.log(`📍 CUENTA ${i + 1}/${publicKeys.length}`);
    console.log('▼'.repeat(60) + '\n');
    
    try {
      // Intentar cargar la cuenta
      const account = await server.loadAccount(publicKey);
      
      // EXTRAER INFORMACIÓN CLAVE:
      
      // 1. Balance de XLM
      // find() busca en el array de balances el que sea de tipo 'native'
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      const balanceXLM = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
      
      // 2. Calcular XLM disponible (descontando reservas)
      const baseReserve = 0.5;
      const subentryReserve = account.subentry_count * 0.5;
      const totalReserve = baseReserve + subentryReserve;
      const disponible = balanceXLM - totalReserve;
      
      // 3. Contar trustlines activos
      // filter() crea un nuevo array solo con los balances que NO son nativos
      // length cuenta cuántos elementos hay en ese array
      const trustlinesActivos = account.balances.filter(b => b.asset_type !== 'native').length;
      
      // 4. Obtener sequence number
      const sequenceNumber = account.sequenceNumber();
      
      // MOSTRAR RESUMEN DE LA CUENTA
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 RESUMEN DE CUENTA');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Cuenta: ${publicKey.substring(0, 10)}...${publicKey.substring(publicKey.length - 6)}`);
      console.log(`  💰 Balance XLM: ${balanceXLM.toFixed(7)} XLM`);
      console.log(`  ✅ Disponible: ${disponible.toFixed(7)} XLM`);
      console.log(`  🔒 Bloqueado: ${totalReserve.toFixed(7)} XLM`);
      console.log(`  🔗 Trustlines: ${trustlinesActivos}`);
      console.log(`  🔢 Sequence: ${sequenceNumber}`);
      console.log(`  📦 Subentries: ${account.subentry_count}`);
      console.log('═══════════════════════════════════════════════════════');
      
      // Si tiene trustlines, mostrar detalles de cada uno
      if (trustlinesActivos > 0) {
        console.log('\n🪙 TOKENS ADICIONALES:');
        account.balances.forEach((balance, idx) => {
          if (balance.asset_type !== 'native') {
            console.log(`   ${idx}. ${balance.asset_code}: ${balance.balance}`);
            console.log(`      Emisor: ${balance.asset_issuer.substring(0, 10)}...`);
          }
        });
      }
      
      // Guardar resultado exitoso
      resultados.push({
        numero: i + 1,
        publicKey: publicKey,
        exitoso: true,
        balanceXLM: balanceXLM,
        disponible: disponible,
        bloqueado: totalReserve,
        trustlines: trustlinesActivos,
        sequence: sequenceNumber,
        subentries: account.subentry_count
      });
      
      cuentasExitosas++;
      
    } catch (error) {
      // Si la consulta falla, registrar el error
      console.log('═══════════════════════════════════════════════════════');
      console.log(`❌ ERROR al consultar cuenta ${i + 1}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Cuenta: ${publicKey.substring(0, 10)}...`);
      console.log(`Error: ${error.message}`);
      console.log('═══════════════════════════════════════════════════════');
      
      resultados.push({
        numero: i + 1,
        publicKey: publicKey,
        exitoso: false,
        error: error.message
      });
      
      cuentasFallidas++;
    }
    
    // Pequeña pausa entre consultas (500ms = 0.5 segundos)
    if (i < publicKeys.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // MOSTRAR RESUMEN FINAL CON ESTADÍSTICAS
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('         📈 RESUMEN GENERAL DEL MONITOREO');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(`   Total consultadas: ${publicKeys.length}`);
  console.log(`   ✅ Exitosas: ${cuentasExitosas}`);
  console.log(`   ❌ Fallidas: ${cuentasFallidas}`);
  
  // Calcular totales solo de cuentas exitosas
  const cuentasValidas = resultados.filter(r => r.exitoso);
  
  if (cuentasValidas.length > 0) {
    // reduce() suma todos los valores del array
    const totalXLM = cuentasValidas.reduce((sum, r) => sum + r.balanceXLM, 0);
    const totalDisponible = cuentasValidas.reduce((sum, r) => sum + r.disponible, 0);
    const totalBloqueado = cuentasValidas.reduce((sum, r) => sum + r.bloqueado, 0);
    const totalTrustlines = cuentasValidas.reduce((sum, r) => sum + r.trustlines, 0);
    
    console.log(`\n💰 TOTALES:`);
    console.log(`   XLM Total: ${totalXLM.toFixed(7)} XLM`);
    console.log(`   Disponible: ${totalDisponible.toFixed(7)} XLM`);
    console.log(`   Bloqueado: ${totalBloqueado.toFixed(7)} XLM`);
    console.log(`   Trustlines Totales: ${totalTrustlines}`);
  }
  
  console.log('\n═'.repeat(60));
  console.log('🏁 Monitoreo completado');
  console.log(`⏰ ${new Date().toLocaleString('es-AR')}`);
  console.log('═'.repeat(60) + '\n');
  
  // Retornar todos los resultados
  return resultados;
}

// EJECUTAR el monitor con todas las cuentas
monitorearCuentas(PUBLIC_KEYS);

// INSTRUCCIONES PARA EJECUTAR:
// 1. Reemplazar las public keys en el array PUBLIC_KEYS con cuentas reales
// 2. Ejecutar con: node consultar-balance.js
// 3. Recordar tener "type": "module" en tu package.json