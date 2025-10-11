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

//IMPORTAMOS LA KEYPAIR, SERVER, TRANSACTIONBUILDER, NETWORKS, OPERATION, ASSET, BASE_FEE Y MEMO
//desde stellar sdk

//le digo que la network es testnet
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

//aca ponemos la secret key, pegamos de lo que generamos
const SECRET_KEY = 'SBXXX...'; // Tu secret key
const DESTINATION = 'GBYYY...'; // Cuenta destino

//para destinarion nos copiamos el address de mi compañera


//funcino asincrona que recibe amount y memo.
async function enviarPago(amount, memo = '') {
  try {
    console.log('🚀 Iniciando pago...\n');
    
    // Paso 1: Cargar tu cuenta
    //lo hace automaticamente de from secret del secret key que pusimos antes
    const sourceKeys = Keypair.fromSecret(SECRET_KEY);
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    //me da el balance actual de mi cuenta con la que envio
    console.log(`Balance actual: ${sourceAccount.balances[0].balance} XLM\n`);
    
    // Paso 2: Construir transacción
    //el trasnaction builde rpuede crear la operacion completa
    
    //primero le digo cual va a ser el fee (que es BASE_FEE porque en stellar es fijo)
    //el asset nativo es XLM
    //le paso la cantidad que quiero enviar
    //le paso el memo que quiero poner (si no pongo nada pone none)
    //set timeout es para que si no se confirma en 30 segundos no se envie
    //y build para construirla
    //me devuelve la transaccion completa
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(Operation.payment({
        destination: DESTINATION,
        asset: Asset.native(),
        amount: amount.toString()
      }))
      .addMemo(memo ? Memo.text(memo) : Memo.none())
      .setTimeout(30)
      .build(); //construye la transaccion
    
    // Paso 3: Firmar
    transaction.sign(sourceKeys); //firmo con mi secret key
    
    // Paso 4: Enviar
    const result = await server.submitTransaction(transaction); //espero el server para enviar

    //console log con el hash
    console.log('🎉 ¡PAGO EXITOSO!\n');
    console.log(`💰 Enviaste: ${amount} XLM`);
    console.log(`🔗 Hash: ${result.hash}\n`);
    
    return result;
    
    //si sale mal me da el error
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  }
}

enviarPago('25', '¡Mi primer pago con código! 🚀');

//luego escribir node enviar-pago.js para ejecutarlo

//sale error, ¿por que? --> porque hoy stellar no llama mas asi al servidor
//antes decia SERVER .
//vamos a depelovers.stellar.org y si ves el SDK sale Javascript SDK
//ahi tenes la documentacion y si vas a HORIZON: tiene por dentro al server
//el server es parte de horizon, para llamar al server primero tengo que llamar al horizon y despues pasarle la red de testnet
//podemos ver el npm con toda la informacion