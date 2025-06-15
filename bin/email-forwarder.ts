#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EmailForwarderStack } from '../lib/email-forwarder-stack';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = new cdk.App();

// Chargement de la configuration
const configPath = join(process.cwd(), 'config/config.json');

if (!existsSync(configPath)) {
  console.error('❌ Fichier de configuration manquant!');
  console.error('📝 Copiez config/config.example.json vers config/config.json');
  console.error('⚙️  Puis configurez vos paramètres personnels');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));

new EmailForwarderStack(app, 'EmailForwarderStack', {
  env: {
    account: config.account,
    region: config.region,
  },
  description: `Stack de transfert d'emails pour ${config.domainName}`,
  config // Passer la config directement
});

app.synth();