# 📧 AWS Email Forwarder CDK

Simple CDK implementation of the AWS tutorial for email forwarding with SES.
Built on top of the mature `@seeebiii/ses-email-forwarding` package.

## ✨ Features

- ✅ **Automatic email forwarding** via AWS SES
- ✅ **Multi-domain support** - Forward emails from multiple domains
- ✅ **Simple configuration** via JSON file
- ✅ **Automatic domain verification** (Route53)
- ✅ **Multiple email mappings** per domain
- ✅ **Node.js 22.x runtime** - Automatically enforced on Lambda functions
- ✅ **S3 lifecycle management** - Intelligent Tiering and automatic cleanup
- ✅ **Secure** - No secrets in code
- ✅ **One-command deployment**

## 🏗️ Architecture

This solution replicates the architecture from the [AWS tutorial](https://aws.amazon.com/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination/):

1. **SES** receives the email on your domain(s)
2. **S3** temporarily stores the email with optimized storage classes
3. **Lambda** (Node.js 22.x) processes and forwards the email
4. **SES** sends the email to the final destination

### S3 Lifecycle Management

The solution automatically configures S3 lifecycle policies:
- **Day 0**: Transition to Intelligent Tiering for cost optimization
- **Day 90**: Automatic deletion of emails
- **Day 1**: Cleanup of incomplete multipart uploads

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo>
cd aws-email-forwarder-cdk

# Install dependencies
yarn install
```

### 2. Configuration

```bash
# Copy the example configuration
cp config/config.example.json config/config.json

# Edit the configuration
nano config/config.json
```

### 3. Configure Your Parameters

Edit `config/config.json` with your information:

```json
{
  "account": "123456789012",
  "region": "us-east-1",
  "domains": [
    {
      "domainName": "first-domain.com",
      "fromPrefix": "noreply",
      "verifyDomain": true,
      "verifyTargetEmailAddresses": false,
      "emailMappings": [
        {
          "receivePrefix": "contact",
          "targetEmails": ["you@gmail.com"]
        },
        {
          "receivePrefix": "info",
          "targetEmails": ["you@gmail.com"]
        }
      ]
    },
    {
      "domainName": "second-domain.net",
      "fromPrefix": "forward",
      "verifyDomain": true,
      "verifyTargetEmailAddresses": false,
      "emailMappings": [
        {
          "receivePrefix": "hello",
          "targetEmails": ["another@gmail.com"]
        },
        {
          "receivePrefix": "admin",
          "targetEmails": ["admin@example.com"]
        }
      ]
    }
  ]
}
```

### 4. Deploy

```bash
# Option 1: Direct deployment (recommended)
npx cdk deploy

# Option 2: Build then deploy
yarn build
npx cdk deploy
```

## ⚙️ Detailed Configuration

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `account` | AWS Account ID | `"123456789012"` |
| `region` | AWS Region | `"us-east-1"` |
| `domains` | Array of domain configurations | See below |

### Domain Configuration

Each domain in the `domains` array requires:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `domainName` | Your domain name | `"example.com"` |
| `fromPrefix` | Sender prefix | `"noreply"` |
| `verifyDomain` | Auto domain verification (Route53) | `true` |
| `verifyTargetEmailAddresses` | Verify destination emails | `false` |
| `emailMappings` | Email forwarding mappings | See below |

### Email Mappings

```json
"emailMappings": [
  {
    "receivePrefix": "contact",
    "targetEmails": ["admin@gmail.com", "support@company.com"]
  },
  {
    "receivePrefix": "newsletter",
    "targetEmails": ["marketing@company.com"]
  }
]
```

This configuration will:
- Forward `contact@example.com` → `admin@gmail.com` and `support@company.com`
- Forward `newsletter@example.com` → `marketing@company.com`

## 📋 Prerequisites

### AWS

- ✅ Configured AWS account
- ✅ CDK v2 installed: `npm install -g aws-cdk`
- ✅ AWS permissions: SES, S3, Lambda, IAM
- ✅ Owned domain (Route53 recommended)

### Local

- ✅ Node.js >= 18
- ✅ TypeScript
- ✅ Configured AWS CLI

## 🔧 Useful Commands

```bash
# Installation
yarn install               # Install dependencies

# CDK (main commands)
npx cdk deploy             # Deploy to AWS
npx cdk synth              # Generate CloudFormation
npx cdk destroy            # Delete the stack
npx cdk diff               # View changes

# Development (optional)
yarn build                 # Compile TypeScript
yarn watch                 # Auto compilation
yarn test                  # Run unit tests
```

## 🛠️ Post-Deployment

### 1. DNS Configuration

If your domain is **not** on Route53, manually add:

```
# MX Record
10 inbound-smtp.us-east-1.amazonaws.com
```

(Replace `us-east-1` with your region)

### 2. SES Verification

- Verify that your domain is validated in the SES console
- Exit SES sandbox if necessary
- Test sending an email

### 3. Testing

Send an email to `contact@your-domain.com` and verify reception.

## 🔍 Troubleshooting

### Email Not Received

1. ✅ Check Lambda CloudWatch logs
2. ✅ Verify domain is verified in SES
3. ✅ Check MX DNS record
4. ✅ Verify you're not in SES sandbox
5. ✅ For multi-domain: Check correct domain configuration

### Deployment Errors

1. ✅ Verify `config/config.json` exists
2. ✅ Check AWS permissions
3. ✅ Verify SES region is supported
4. ✅ Validate JSON configuration format

### Multi-Domain Issues

1. ✅ Each domain must have unique MX records
2. ✅ All domains must be verified in SES
3. ✅ Check CloudFormation outputs for configured domains

## 🔧 Advanced Features

### Node.js 22.x Runtime

The stack automatically patches Lambda functions to use Node.js 22.x runtime, ensuring you have the latest features and security updates.

### S3 Cost Optimization

The solution includes automatic S3 lifecycle management:
- **Intelligent Tiering**: Automatically moves objects between access tiers based on usage patterns
- **Automatic Deletion**: Emails are deleted after 90 days
- **Cleanup**: Incomplete multipart uploads are removed after 1 day

### Configuration Validation

The stack includes robust validation:
- Validates required fields for each domain
- Ensures at least one email mapping per domain
- Validates email mapping structure

## 💰 Costs

For 1000 emails/month (~2KB each):
- **SES**: ~$0.10
- **S3**: <$0.01 (with lifecycle optimization)
- **Lambda**: <$0.01
- **Total**: ~$0.11/month

*Costs exclude domain registration (typically the highest cost)*

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/improvement`)
3. Commit (`git commit -am 'Add feature'`)
4. Push (`git push origin feature/improvement`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [AWS official tutorial](https://aws.amazon.com/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination/)
- [@seeebiii/ses-email-forwarding](https://github.com/seeebiii/ses-email-forwarding) - The CDK construct used
- AWS CDK community

---

**🚀 Ready to deploy?**
```bash
cp config/config.example.json config/config.json
# Edit config.json with your parameters
yarn install
npx cdk deploy
```

> 💡 **Tip**: No need for `yarn build`! CDK compiles automatically with `ts-node`.
