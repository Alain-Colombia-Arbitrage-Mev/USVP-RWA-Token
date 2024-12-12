import { ethers, network } from "hardhat";
import { verify } from "../utils/verify";

async function main() {
  try {
    // Configuración inicial
    const [deployer] = await ethers.getSigners();
    console.log("----------------------------------------------------");
    console.log("🚀 Iniciando despliegue de USVP Token");
    console.log("Cuenta deployadora:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.provider!.getBalance(deployer.address)), "ETH");
    console.log("Red:", network.name);
    console.log("----------------------------------------------------");

    // Parámetros de despliegue con gas optimizado
    const roles = {
      defaultAdmin: "0xbf646CD04B14eb9159d2000e73C4C339A3C980d9",  // Admin y Pauser
      pauser: "0xbf646CD04B14eb9159d2000e73C4C339A3C980d9",       // Misma que Admin
      minter: "0x57274FFE9661e32380fAdc50C59A3b470b1E9CA4",       // Minter y Limiter
      limiter: "0x57274FFE9661e32380fAdc50C59A3b470b1E9CA4",      // Misma que Minter
      custodian: "0xB04196E11CD8FC207BC52DeCeD7CEA2445B20323"     // Custodian
    };

    // Desplegar el contrato con configuración de gas optimizada
    console.log("\n📄 Desplegando USVP Token...");
    const USVP = await ethers.getContractFactory("USVP");
    const usvp = await USVP.deploy(
      roles.defaultAdmin,
      roles.pauser,
      roles.minter,
      roles.limiter,
      roles.custodian,
      {
        gasLimit: 5000000 // Gas limit optimizado
      }
    );

    await usvp.waitForDeployment();
    const usvpAddress = await usvp.getAddress();
    
    console.log("✅ USVP Token desplegado en:", usvpAddress);
    console.log("----------------------------------------------------");

    // Verificar roles (usando los bytes32 precalculados del contrato)
    console.log("\n🔍 Verificando roles...");
    
    const roleChecks = [
      { name: "PAUSER", role: await usvp.PAUSER_ROLE(), address: roles.pauser },
      { name: "MINTER", role: await usvp.MINTER_ROLE(), address: roles.minter },
      { name: "LIMITER", role: await usvp.LIMITER_ROLE(), address: roles.limiter },
      { name: "CUSTODIAN", role: await usvp.CUSTODIAN_ROLE(), address: roles.custodian }
    ];

    for (const check of roleChecks) {
      const hasRole = await usvp.hasRole(check.role, check.address);
      console.log(`${check.name}_ROLE: ${hasRole ? '✅' : '❌'} ${check.address}`);
    }

    // Verificar suministros
    const totalSupply = await usvp.totalSupply();
    const remaining = await usvp.remainingSupply();
    
    console.log("\n📊 Información del Token:");
    console.log(`💰 Suministro Inicial: ${ethers.formatEther(totalSupply)} USVP`);
    console.log(`🎯 Suministro Máximo: 1,000,000,000 USVP`);
    console.log(`📈 Suministro Disponible: ${ethers.formatEther(remaining)} USVP`);

    // Verificar el contrato si no estamos en red local
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n🔍 Verificando contrato en el explorador...");
      try {
        await verify(usvpAddress, [
          roles.defaultAdmin,
          roles.pauser,
          roles.minter,
          roles.limiter,
          roles.custodian
        ]);
        console.log("✅ Contrato verificado exitosamente");
      } catch (error: any) {
        if (error?.message?.includes('Already Verified')) {
          console.log("✅ Contrato ya verificado");
        } else {
          console.log("❌ Error en la verificación:", error);
        }
      }
    }

    // Guardar información del deployment
    saveDeployment(network.name, {
      address: usvpAddress,
      deployer: deployer.address,
      roles: roles,
      initialSupply: ethers.formatEther(totalSupply),
      remainingSupply: ethers.formatEther(remaining),
      deploymentTime: new Date().toISOString()
    });

    console.log("\n🎉 Despliegue completado exitosamente!");
    console.log("----------------------------------------------------");

  } catch (error) {
    console.error("\n❌ Error en el despliegue:", error);
    process.exit(1);
  }
}

interface DeploymentInfo {
  address: string;
  deployer: string;
  roles: {
    defaultAdmin: string;
    pauser: string;
    minter: string;
    limiter: string;
    custodian: string;
  };
  initialSupply: string;
  remainingSupply: string;
  deploymentTime: string;
}

function saveDeployment(network: string, deploymentInfo: DeploymentInfo) {
  const fs = require("fs");
  const deploymentPath = "./deployments.json";
  
  const deployments = fs.existsSync(deploymentPath)
    ? JSON.parse(fs.readFileSync(deploymentPath))
    : {};

  deployments[network] = {
    ...deploymentInfo,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("\n📝 Información del despliegue guardada en deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });