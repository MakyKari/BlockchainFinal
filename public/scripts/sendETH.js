document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('sendETHForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ethAmount = document.getElementById('ethAmount').value;

        await sendSepoliaETH(ethAmount);
    });

})

let transactionInProgress = false;

async function sendSepoliaETH(ethAmount) {

    try {
        if (transactionInProgress) {
            console.log('Transaction already in progress');
            return;
        }
        transactionInProgress = true;

        const contractAddress = '0x42261ac16900A9d81d4e074Cf615447748487692';

        const recipientAddress = '0x0bb84163C297E0c0b119Ec13D0F882dAcE5a2AC2';

        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const ABI = [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_recipient",
                        "type": "address"
                    }
                ],
                "name": "sendSepoliaETH",
                "outputs": [],
                "payable": true,
                "stateMutability": "payable",
                "type": "function"
            }
        ];
        const contract = new web3.eth.Contract(ABI, contractAddress);

        if (ethAmount <= 0) {
            document.getElementById('negative_value_error').style.display = 'block';
            console.error('Invalid amount');
            transactionInProgress = false;
            return;
        }

        ethAmount = ethAmount.toString();

        try {
            updateDonatedAmount(ethAmount);
            console.log('Sending Sepolia ETH', recipientAddress, window.ethereum.selectedAddress)
            const tx = await contract.methods.sendSepoliaETH(recipientAddress).send({
                from: window.ethereum.selectedAddress, 
                value: web3.utils.toWei(ethAmount, 'ether') 
            });

            console.log('Sepolia ETH sent successfully');
            
        } catch (error) {
            console.error('Error sending Sepolia ETH:', error);
        }

        transactionInProgress = false;
        await sendTransaction(ethAmount);
    }
    catch (error) {
        console.error('Error sending Sepolia ETH:', error);
        transactionInProgress = false;
    }

    
}

function updateDonatedAmount(ethAmount) {
    const id = document.getElementById('id')

    fetch('/donate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id.innerText,
            amount: parseFloat(ethAmount)
        })
    })
}