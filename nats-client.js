const { connect, StringCodec } = require('nats');

async function testNATSConnection() {
  try {
    const nc = await connect({ servers: 'nats://nats:4222' });

    console.log('Connected to NATS');

    // Example of publishing and subscribing to a topic
    const sc = StringCodec();
    const sub = nc.subscribe('updates');
    (async () => {
      for await (const m of sub) {
        console.log(`Received message: ${sc.decode(m.data)}`);
      }
    })().catch(console.error);

    // Publish a test message
    nc.publish('updates', sc.encode('Hello, NATS!'));

    // Close connection after some time
    setTimeout(() => {
      nc.close();
      console.log('Connection closed');
    }, 5000);
  } catch (err) {
    console.error('Error connecting to NATS:', err);
  }
}

testNATSConnection();
