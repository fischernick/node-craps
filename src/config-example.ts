import fs from 'fs';
import { HandsConfig } from './hands.js';

// Example of how to save a configuration to a JSON file
function saveConfigToFile(config: HandsConfig, filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`Configuration saved to ${filePath}`);
}

// Example of how to load a configuration from a JSON file
function loadConfigFromFile(filePath: string): HandsConfig {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(fileContents) as HandsConfig;
        console.log(`Configuration loaded from ${filePath}`);
        return config;
    } catch (err) {
        console.error('Error reading config file:', err);
        process.exit(1);
    }
}

// Example usage
const exampleConfig: HandsConfig = {
    numHands: 100,
    showDetail: true,
    startingBalance: 10000,
    bettingStrategy: 'dontComeWithPlaceBets',
    handsFile: 'rolls.json'
};

// Save the example configuration to a file
saveConfigToFile(exampleConfig, 'craps-config.json');

// Load the configuration from the file
const loadedConfig = loadConfigFromFile('craps-config.json');

// Example of how to use the loaded configuration
console.log('Loaded configuration:');
console.log(`- Number of hands: ${loadedConfig.numHands}`);
console.log(`- Show detail: ${loadedConfig.showDetail}`);
console.log(`- Starting balance: $${loadedConfig.startingBalance}`);
console.log(`- Betting strategy: ${loadedConfig.bettingStrategy}`);
console.log(`- Hands file: ${loadedConfig.handsFile || 'None'}`);

// Example of how to run the hands.ts script with the loaded configuration
// This would be done in a separate script or command
console.log('\nTo run hands.ts with this configuration, you would use:');
console.log(`node --loader ts-node/esm src/hands.ts ${loadedConfig.numHands} ${loadedConfig.showDetail} ${loadedConfig.startingBalance} ${loadedConfig.bettingStrategy} ${loadedConfig.handsFile || ''}`); 