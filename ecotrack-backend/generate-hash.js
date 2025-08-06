// generate-hash.js (archivo temporal)
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = '123456';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash generado:', hash);
        
        // Verificar que funciona
        const isValid = await bcrypt.compare(password, hash);
        console.log('Verificación:', isValid ? '✅ Correcto' : '❌ Error');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();