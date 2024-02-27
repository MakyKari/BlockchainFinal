
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('addCompanyForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('companyName').value;
        const description = document.getElementById('companyDescription').value;
        const fundingGoal = document.getElementById('companyGoal').value;

        if (fundingGoal <= 0) {
            document.getElementById('negative_value_error').style.display = 'block';
            console.error('Invalid amount');
            return;
        }

        await createProject(title, title, description, fundingGoal);
    });
})


const ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_cardsId",
                "type": "string"
            },
            {
                "name": "_title",
                "type": "string"
            },
            {
                "name": "_description",
                "type": "string"
            },
            {
                "name": "_fundingGoal",
                "type": "uint256"
            }
        ],
        "name": "createProject",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }    
];
const contractAddress = '0x0Cd806658221155923834121970C19AB87ee8588';

let transactionInProgress = false;

async function createProject(cardsId, title, description, fundingGoal) {
    try {

        if (transactionInProgress) {
            console.log('Transaction already in progress');
            return;
        }
        transactionInProgress = true;

        fundingGoal = parseFloat(fundingGoal, 10);

        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const contract = new web3.eth.Contract(ABI, contractAddress);

        console.log('Creating card', window.ethereum.selectedAddress)
        sendProjectToDB(title, description, fundingGoal);

        const fundingGoalInWei = web3.utils.toWei(fundingGoal.toString(), 'ether');

        await contract.methods.createProject(cardsId, title, description, fundingGoalInWei).send({
            from: window.ethereum.selectedAddress,
            gas: 300000
        }).then(() => {
            console.log('Project created successfully');
        }).catch(error => {
            console.error('Error creating project:', error);
        });

        transactionInProgress = false;
        console.log('Project created successfully');
    } catch (error) {
        transactionInProgress = false;
        console.error('Error creating project:', error);
    }
}

function sendProjectToDB(title,description, fundingGoal) {
    console.log('Sending project to DB');
    const formData = new FormData();
    formData.append('companyName', title);
    formData.append('description', description);
    formData.append('companyGoal', fundingGoal);
    formData.append('photo', document.getElementById('companyPhoto').files[0]);

    fetch('/admin/addCompany', {
        method: 'POST',
        body: formData
    })
}