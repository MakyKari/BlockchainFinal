const { expect } = require("chai");

describe("SepoliaDonation", function () {
  let sepoliaDonation;
  let owner = "0x0bb84163C297E0c0b119Ec13D0F882dAcE5a2AC2";
  let addr1 = "0x0bb84163C297E0c0b119Ec13D0F882dAcE5a2AC2";

  beforeEach(async function () {
    const SepoliaDonation = await ethers.getContractFactory("SepoliaDonation");
    sepoliaDonation = await SepoliaDonation.deploy();
    await sepoliaDonation.deployed(); // Ensure contract deployment is complete
  });

  it("Should create a project", async function () {
    const cardsId = "123";
    const title = "Test Project";
    const description = "Description of Test Project";
    const fundingGoal = 100;

    await sepoliaDonation.createProject(cardsId, title, description, fundingGoal);

    const project = await sepoliaDonation.projects(cardsId);
    
    expect(project.title).to.equal(title);
    expect(project.description).to.equal(description);
    expect(project.fundingGoal).to.equal(fundingGoal);
    expect(project.totalFunding).to.equal(0);
    expect(project.funded).to.equal(false);
  });

  it("Should fund a project", async function () {
    const cardsId = "123";
    const contribution = 50;

    await sepoliaDonation.createProject(cardsId, "Test Project", "Description", 100);
    const initialFunding = (await sepoliaDonation.projects(cardsId)).totalFunding;
    await sepoliaDonation.fundProject(cardsId, { value: contribution });
    const finalFunding = (await sepoliaDonation.projects(cardsId)).totalFunding;

    expect(finalFunding).to.equal(initialFunding + contribution);
  });

  it("Should cancel a project", async function () {
    const cardsId = "123";

    await sepoliaDonation.createProject(cardsId, "Test Project", "Description", 100);
    await sepoliaDonation.cancelProject(cardsId);

    const project = await sepoliaDonation.projects(cardsId);
    expect(project.fundingGoal).to.equal(0);
    expect(project.totalFunding).to.equal(0);
    expect(project.funded).to.equal(false);
  });
});
