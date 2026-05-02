const bcrypt = require('bcrypt');

const myPassword = 'Kenya@2030'; // Your desired password

bcrypt.hash(myPassword, 10)
  .then(hash => {
      console.log('\n=== COPY THE HASH BELOW ===');
      console.log(hash);
      console.log('===========================\n');
  })
  .catch(err => console.error(err));