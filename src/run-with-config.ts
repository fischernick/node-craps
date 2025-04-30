import fs from 'fs';
import { spawn } from 'child_process';
import { HandsConfig } from './hands.js';

// Load configuration from a JSON file
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

// Run hands.ts with the provided configuration
function runHandsWithConfig(config: HandsConfig): void {
    // Build the command line arguments
    const args = [
        '--loader', 'ts-node/esm',
        'src/hands.ts',
        config.numHands?.toString() || '10',
        config.showDetail ? 'true' : 'false',
        config.startingBalance?.toString() || '5000',
        config.bettingStrategy || 'dontComeWithPlaceBets',
        config.handsFile || ''
    ];

    // Filter out empty strings
    const filteredArgs = args.filter(arg => arg !== '');

    console.log('Running hands.ts with the following configuration:');
    console.log(`- Number of hands: ${config.numHands || 10}`);
    console.log(`- Show detail: ${config.showDetail || false}`);
    console.log(`- Starting balance: $${config.startingBalance || 5000}`);
    console.log(`- Betting strategy: ${config.bettingStrategy || 'dontComeWithPlaceBets'}`);
    console.log(`- Hands file: ${config.handsFile || 'None'}`);

    // Spawn the process
    const handsProcess = spawn('node', filteredArgs, { stdio: 'inherit' });

    // Handle process events
    handsProcess.on('error', (err) => {
        console.error('Failed to start hands.ts:', err);
    });

    handsProcess.on('close', (code) => {
        console.log(`hands.ts process exited with code ${code}`);
    });
}

// Main function
function main() {
    // Check if a config file was provided
    const configFilePath = process.argv[2];
    if (!configFilePath) {
        console.error('Please provide a path to a configuration file');
        console.error('Usage: node --loader ts-node/esm src/run-with-config.ts <config-file-path>');
        process.exit(1);
    }

    // Load the configuration
    const config = loadConfigFromFile(configFilePath);

    // Run hands.ts with the configuration
    runHandsWithConfig(config);
}

// Run the main function
main(); 