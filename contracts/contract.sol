// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SepoliaDonation {
    event DonationSent(address indexed sender, address indexed recipient, uint256 amount);
    event TransactionFailed(address indexed sender, string reason);

    function sendSepoliaETH(address payable _recipient, string memory _projectId) external payable {
        
        Project storage project = projects[_projectId];
        
        require(!project.funded, "Project has already been funded");
        require(msg.value > 0, "Amount must be greater than 0");

        if (msg.value <= 0) {
            emit TransactionFailed(msg.sender, "You must send some Sepolia ETH");

            revert("You must send some Sepolia ETH");
        }

        
        project.totalFunding += msg.value;
        
        if (project.totalFunding >= project.fundingGoal) {
            project.funded = true;
            emit ProjectSuccessful(_projectId);
        }

        _recipient.transfer(msg.value);
        
        emit ProjectFunded(_projectId, msg.sender, msg.value);

        emit DonationSent(msg.sender, _recipient, msg.value);
    }

    address public owner;

    struct Project {
        address creator;
        string title;
        string description;
        uint256 fundingGoal;
        uint256 totalFunding;
        bool funded;
    }

    mapping(string => Project) public projects;
    uint256 public totalProjects;

    event ProjectCreated(string projectId, address indexed creator, string title, uint256 fundingGoal);
    event ProjectFunded(string projectId, address indexed backer, uint256 amount);
    event ProjectSuccessful(string projectId);
    event ProjectCanceled(string projectId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    event LogCreatedProject(string projectId, address creator, string title, uint256 fundingGoal);
    event LogCreateProjectInputs(address indexed sender, string _cardsId, string _title, string _description, uint256 _fundingGoal);

    function createProject(string memory _cardsId, string memory _title, string memory _description, uint256 _fundingGoal) external {
    require(_fundingGoal > 0, "Funding goal must be greater than 0");

        string memory projectId = _cardsId;

        emit LogCreateProjectInputs(msg.sender, _cardsId, _title, _description, _fundingGoal);

        projects[projectId] = Project({
            creator: msg.sender,
            title: _title,
            description: _description,
            fundingGoal: _fundingGoal,
            totalFunding: 0,
            funded: false
        });

        emit LogCreatedProject(projectId, msg.sender, _title, _fundingGoal);
    }

    function cancelProject(string memory _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only the project creator can cancel the project");
        require(!project.funded, "Cannot cancel a funded project");

        project.totalFunding = 0;

        delete projects[_projectId];
        totalProjects--;

        emit ProjectCanceled(_projectId);
    }
}
