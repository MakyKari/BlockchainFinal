const ethereumButton = document.getElementById('connectWalletBtn');
const showAccount = document.getElementById('showAccount');
const donateButton = document.getElementById('Donate');
const cashField = document.getElementById('cashAmount');

ethereumButton.addEventListener('click', async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            showAccount.innerText = accounts[0];
            console.log('Connected to MetaMask');

            ethereumButton.style.display = 'none';
            donateButton.style.display = 'block';
            cashField.style.display = 'block';
        } catch (error) {
            if (error.code === 4001) {
                console.log('User denied access to MetaMask');
            } else {
                console.error('Error connecting to MetaMask:', error);
            }
        }
    } else {
        console.error('MetaMask not detected');
    }
});
