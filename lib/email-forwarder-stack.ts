import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailForwardingRuleSet } from '@seeebiii/ses-email-forwarding';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

interface EmailForwarderStackProps extends cdk.StackProps {
  config: any;
}

export class EmailForwarderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EmailForwarderStackProps) {
    super(scope, id, props);

    const config = props.config;

    // Validation de la configuration
    this.validateConfig(config);

    // Création du système de transfert d'emails avec SES
    // On utilise une approche personnalisée pour forcer Node.js 22
    const emailForwardingRuleSet = new EmailForwardingRuleSet(this, 'EmailForwardingRuleSet', {
      // Active automatiquement le rule set (un seul peut être actif)
      enableRuleSet: true,

      // Configuration du transfert d'emails
      emailForwardingProps: [{
        // Nom de domaine pour recevoir/envoyer les emails
        domainName: config.domainName,

        // Vérification automatique du domaine dans SES (nécessite Route53)
        verifyDomain: config.verifyDomain,

        // Vérification des adresses email de destination (si pas de domaine vérifié)
        verifyTargetEmailAddresses: config.verifyTargetEmailAddresses,

        // Préfixe pour l'adresse d'expédition (ex: noreply@domaine.fr)
        fromPrefix: config.fromPrefix,

        // Mappings des adresses email
        emailMappings: config.emailMappings
      }]
    });

    // Patch pour forcer Node.js 22.x sur la fonction lambda de transfert d'emails
    this.patchLambdaRuntime(emailForwardingRuleSet);

    // Outputs utiles
    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'Domaine configuré pour le transfert d\'emails'
    });

    new cdk.CfnOutput(this, 'EmailMappings', {
      value: JSON.stringify(config.emailMappings, null, 2),
      description: 'Mappings d\'emails configurés'
    });
  }

  private patchLambdaRuntime(emailForwardingRuleSet: EmailForwardingRuleSet): void {
    // On parcourt tous les enfants du construct pour trouver les lambdas
    const findLambdas = (construct: Construct): lambda.Function[] => {
      const lambdas: lambda.Function[] = [];

      for (const child of construct.node.children) {
        if (child instanceof lambda.Function) {
          lambdas.push(child);
        }
        // Récursion sur les enfants
        lambdas.push(...findLambdas(child));
      }

      return lambdas;
    };

    const lambdaFunctions = findLambdas(emailForwardingRuleSet);

    for (const lambdaFunction of lambdaFunctions) {
      // On identifie la lambda de transfert d'emails par son nom ou ses propriétés
      const resourceName = lambdaFunction.node.id;

      // Si c'est la lambda de transfert d'emails (elle contient généralement "EmailForwarding" dans le nom)
      if (resourceName.includes('EmailForwarding')) {
        // On force le runtime à Node.js 22.x en accédant à la ressource CloudFormation sous-jacente
        const cfnFunction = lambdaFunction.node.defaultChild as lambda.CfnFunction;
        cfnFunction.runtime = lambda.Runtime.NODEJS_22_X.name;

        console.log(`✅ Runtime mis à jour vers Node.js 22.x pour la lambda: ${resourceName}`);
      }
    }
  }

  private validateConfig(config: any): void {
    const requiredFields = ['domainName', 'fromPrefix', 'emailMappings'];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Champ obligatoire manquant dans la configuration: ${field}`);
      }
    }

    if (!Array.isArray(config.emailMappings) || config.emailMappings.length === 0) {
      throw new Error('Au moins un mapping d\'email doit être configuré');
    }

    for (const mapping of config.emailMappings) {
      if (!mapping.receivePrefix || !mapping.targetEmails || !Array.isArray(mapping.targetEmails)) {
        throw new Error('Chaque mapping doit avoir un receivePrefix et un tableau targetEmails');
      }
    }
  }
}