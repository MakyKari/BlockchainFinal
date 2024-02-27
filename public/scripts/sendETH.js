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

        const contractAddress = '0x0Cd806658221155923834121970C19AB87ee8588';

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
                    },
                    {
                        "name": "_projectId",
                        "type": "string"
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

        ethAmount = String(ethAmount);

        try {
            projectId = document.getElementById('card-title').innerText;
            updateDonatedAmount(ethAmount);
            //updateDonatedAmountInContract(projectId, ethAmount);
            console.log('Sending Sepolia ETH', recipientAddress, window.ethereum.selectedAddress)
            const tx = await contract.methods.sendSepoliaETH(recipientAddress, projectId).send({
                from: window.ethereum.selectedAddress, 
                value: web3.utils.toWei(ethAmount, 'ether'),
                gas: 300000
            });

            console.log('Sepolia ETH sent successfully');
            
        } catch (error) {
            console.error('Error sending Sepolia ETH:', error);
        }

        transactionInProgress = false;
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

// async function updateDonatedAmountInContract(projectId, ethAmount) {
//     const contractAddress = '0x0Cd806658221155923834121970C19AB87ee8588';
//     const web3 = new Web3(window.ethereum);
//     await window.ethereum.enable();

//     const contractABI = [
//             {
//                 "constant": false,
//                 "inputs": [
//                     {
//                         "name": "_projectId",
//                         "type": "string"
//                     }
//                 ],
//                 "name": "fundProject",
//                 "outputs": [],
//                 "payable": true,
//                 "stateMutability": "payable",
//                 "type": "function"
//             }
//     ];

//     const contract = new web3.eth.Contract(contractABI, contractAddress);

//     try {
//         const tx = await contract.methods.fundProject(projectId).send({
//             from: window.ethereum.selectedAddress,
//             value: web3.utils.toWei(ethAmount.toString(), 'ether')
//         });

//         console.log('Donation recorded in the smart contract');
//     } catch (error) {
//         console.error('Error updating donated amount in contract:', error);
//     }
// }
