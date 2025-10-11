import { Horizon } from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const PUBLIC_KEY = 'GBXXX...'; // Cuenta a consultar

async function consultarBalance(publicKey) {
  try {
    console.log(`🔍 Consultando cuenta: ${publicKey.substring(0, 8)}...\n`);
    
    //mete una funcion asincrona que busca la cuenta a traves de mi public key y lo mete en la constante account
    const account = await server.loadAccount(publicKey);
    
    console.log('╔═══════════════════════════════════╗');
    console.log('📊 INFORMACIÓN DE CUENTA');
    console.log('╚═══════════════════════════════════╝\n');
    
    //veo el account idea y el account sequence number
    console.log(`📧 Account ID:`);
    console.log(`   ${account.id}\n`);
    
    console.log(`🔢 Sequence Number:`);
    console.log(`   ${account.sequenceNumber()}\n`);
    
    console.log('╔═══════════════════════════════════╗');
    console.log('💰 BALANCES');
    console.log('╚═══════════════════════════════════╝\n');
    
    //veo los balances
    //en el account que cargue mas arriba, balance
    //el for Each es un bucle, recibe el balance y un indice
    // al ser un array va haciendo una iteracion
    //dentro hay un if, se fija que el asset type sea nativo (sea XLM)
    account.balances.forEach((balance, index) => {
      if (balance.asset_type === 'native') {
        console.log(`${index + 1}. 🌟 XLM (Lumens):`);
        console.log(`   Total: ${balance.balance} XLM`);
        
        //me dije que la reserva es siempre 0.5 (debe tener algo de balance para ser confiable)
        const baseReserve = 0.5;
        const subentryReserve = account.subentry_count * 0.5;
        const totalReserve = baseReserve + subentryReserve;
        const available = parseFloat(balance.balance) - totalReserve;
        
        console.log(`   Bloqueado: ${totalReserve.toFixed(7)} XLM`);
        console.log(`   Disponible: ${available.toFixed(7)} XLM\n`);
      } else {
        console.log(`${index + 1}. 🪙 ${balance.asset_code}:`);
        console.log(`   Balance: ${balance.balance}`);
        console.log(`   Emisor: ${balance.asset_issuer.substring(0, 8)}...\n`);
      } //lo pasa a substring
    });
    
    return account;
    //el catch error es por si hay un error en la respuesta o no encuentra la cuenta
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('❌ Cuenta no encontrada');
      console.log('💡 Posibles causas:');
      console.log('   - La cuenta nunca fue creada/fondeada');
      console.log('   - Error de tipeo en la public key\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
}

consultarBalance(PUBLIC_KEY);