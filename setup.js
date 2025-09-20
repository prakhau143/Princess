// Setup script for HiKraze Ecommerce
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up HiKraze Ecommerce...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envConfigPath = path.join(__dirname, 'env_config.txt');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envConfigPath)) {
        console.log('📋 Creating .env file from template...');
        
        // Read the config template
        let envContent = fs.readFileSync(envConfigPath, 'utf8');
        
        // Prompt for app password
        console.log('\n⚠️  IMPORTANT: You need to add your Gmail App Password!');
        console.log('📧 Gmail: princess.jewellery015@gmail.com');
        console.log('🔑 Please replace "your-app-password-here" with your actual 16-character app password');
        console.log('\n📖 How to get Gmail App Password:');
        console.log('1. Go to https://myaccount.google.com/');
        console.log('2. Security → 2-Step Verification → App passwords');
        console.log('3. Select "Mail" and generate password');
        console.log('4. Copy the 16-character password\n');
        
        // Write .env file
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully!');
        
        // Delete the template
        fs.unlinkSync(envConfigPath);
        console.log('🗑️  Template file cleaned up');
    } else {
        console.log('❌ Configuration template not found!');
        process.exit(1);
    }
} else {
    console.log('✅ .env file already exists');
}

// Check database
const dbPath = path.join(__dirname, 'ecommerce.db');
if (fs.existsSync(dbPath)) {
    console.log('🗄️  Database file exists');
} else {
    console.log('🗄️  Database will be created on first run');
}

// Check required directories
const requiredDirs = ['images', 'json', 'Style', 'JavaScript'];
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`📁 ${dir}/ directory exists`);
    } else {
        console.log(`❌ ${dir}/ directory missing!`);
    }
});

console.log('\n🎉 Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Edit .env file and add your Gmail App Password');
console.log('2. Run: npm start');
console.log('3. Visit: http://localhost:3000');
console.log('\n💡 Need help? Check README.md for detailed instructions');
