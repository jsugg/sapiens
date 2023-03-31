const Docker = require('dockerode');
const appPath = require('app-root-path').toString();
module.exports = (logManager, serverLogger) => {

  // Create the logger
  const containersLogger = logManager.createLogger({name: 'sapiens:containers'});

  // Instantiate a Docker object to be used everywhere
  const docker = new Docker();

  // Function to start containers
  async function startContainer(containerName, image, options) {
    try {
      const containers = await docker.listContainers({ all: true });
      const targetContainers = containers.filter(container => container.Names.includes(`/${containerName}`));
      await Promise.all(targetContainers.map(container => docker.getContainer(container.Id).remove({ force: true })));
      const container = await docker.createContainer({
        Image: image,
        name: containerName,
        ...options,
      });
      await container.start();
      containersLogger.info(`Container ${containerName} started successfully`);
    } catch (error) {
      containersLogger.error(`Failed to start container ${containerName}: ${error}`);
    }
  }

  // Function to create the networks
  async function startNetwork(networkName) {
    try {
      const networks = await docker.listNetworks();
      const targetNetworks = networks.filter(network => network.Name === networkName);
      await Promise.all(targetNetworks.map(network => docker.getNetwork(network.Id).remove({force: true})));
      const network = await docker.createNetwork({
        Name: networkName,
        Attachable: true,
        Driver: 'bridge',
      });
      containersLogger.info(`Network ${networkName} created successfully`);
    } catch (error) {
      containersLogger.error(`Failed to create network ${networkName}: ${error}`);
    }
  }

  // Function to stop and remove containers for cleanup routine
  async function stopAndRemoveContainers(containerNames) {
    try {
      const containers = await docker.listContainers({ all: true });
      const containersToStopAndRemove = containers.filter(container => containerNames.includes(container.Names[0].replace('/', '')));
      await Promise.all(containersToStopAndRemove.map(container => docker.getContainer(container.Id).stop()));
      await Promise.all(containersToStopAndRemove.map(container => docker.getContainer(container.Id).remove({ force: true })));
      containersLogger.info(`All containers with names [${containerNames}] stopped and removed successfully.`);
    } catch (error) {
      containersLogger.error(`Failed to stop and remove containers: ${error}`);
    }
  }

  // Function to remove networks for cleanup routine
  async function stopAndRemoveNetworks(networkNames) {
    try {
      const networks = await docker.listNetworks();
      const filteredNetworks = networks.filter(network => networkNames.includes(network.Name));
      await Promise.all(filteredNetworks.map(network => docker.getNetwork(network.Id).remove()));
      containersLogger.info(`Networks ${networkNames.join(', ')} removed successfully.`);
    } catch (error) {
      containersLogger.error(`Failed to remove networks: ${error}`);
    }
  }

  // Function to start networks and containers
  async function load() {
    containersLogger.info('Starting networks and containers...');
    // Starting docker networks
    containersLogger.debug('Starting networks...');
    await startNetwork('tinode-net');
    await startNetwork('qcraft');

    // Start WordPress container
    containersLogger.debug('Starting containers...');
    await startContainer('wp', 'wordpress', {
      HostConfig: {
        NetworkMode: 'qcraft',
        PortBindings: {
          '80/tcp': [{ HostPort: '8081' }],
        }
      },
      PortBindings: {
        '80/tcp': [{ HostPort: '8081' }],
      },
      Hostname: 'wp.qcraft.com.br',
      RestartPolicy: {
        Name: 'always',
      },
    });

    // Start Tinode rethingdb container
    await startContainer('rethinkdb', 'rethinkdb:2.3', {
      HostConfig: {
        NetworkMode: 'tinode-net',
      },
      Hostname: 'rtdb.qcraft.com.br',
      Name: 'rethinkdb',
      RestartPolicy: {
        Name: 'always',
      },
    });

    // Start Tinode container
    await startContainer('tinode-srv', 'tinode/tinode-rethinkdb:0.21.4', {
      HostConfig: {
        NetworkMode: 'tinode-net',
        PortBindings: {
          '6060/tcp': [{ HostPort: '6060' }],
        }
      },
      PortBindings: {
        '6060/tcp': [{ HostPort: '6060' }],
      },
      Hostname: 'tinode.qcraft.com.br',
      RestartPolicy: {
        Name: 'always',
      },
    })

    containersLogger.info('Networks and containers started.');
  };

  // Cleanup routine
  let cleanupCalled = false;
  const cleanup = () => {
    if (!cleanupCalled) {
      cleanupCalled = true;
      containersLogger.info('Cleaning up before exit...');
      stopAndRemoveContainers(['wp','tinode-srv','rethinkdb'])
        .then(() => {
          return stopAndRemoveNetworks(['tinode-net', 'qcraft']);
        })
        .then(() => {
          containersLogger.info('Cleanup completed.');
          process.exit(0);
        })
        .catch((error) => {
          containersLogger.error('Cleanup error:', error);
          process.exit(1);
        })
      };
  };

  // Handling exit process signals to trigger the cleanup routine
  process.on('exit', cleanup);

  process.on('SIGINT', () => {
    containersLogger.info('Received SIGINT signal.');
    cleanup();
  });

  process.on('SIGTERM', () => {
    containersLogger.info('Received SIGTERM signal.');
    cleanup();
  });

  process.on('uncaughtException', (error) => {
    containersLogger.info('Uncaught exception:', error);
    cleanup();
  });

  setImmediate(() => { serverLogger.debug('[MODULE] containers/containers.js loaded'); });

  // Module exports
  return {
    startContainer,
    startNetwork,
    load,
  };
};