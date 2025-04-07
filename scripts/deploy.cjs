const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Lottery contract...");

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log(`Lottery deployed to: ${address}`);
  console.log("Save this address and update it in src/main.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });