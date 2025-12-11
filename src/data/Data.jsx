import { ethers } from "ethers";

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

// REPLACE WITH YOUR DEPLOYED CONTRACT ADDRESS (from 'npx hardhat run scripts/deploy.js')
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// The ABI (Application Binary Interface)
// This tells JavaScript what functions look like on the Smart Contract.
const CONTRACT_ABI = [
  "function getProduct(string memory _id) public view returns (tuple(string name, string strength, string additives, string originVineyard, string originLocation, bool exists), tuple(string status, string date, string icon)[])"
];

// 1. PARTICIPANTS (from participants.xlsx - Sheet1.csv)
export const PARTICIPANTS = {
  "M1": { name: "Thorakao", role: "Manufacturer", location: "HCM, Vietnam", desc: "Chuyen my pham thien nhien truyen thong" },
  "M2": { name: "Cocoon VN", role: "Manufacturer", location: "Dak Lak, Vietnam", desc: "My pham thuan chay tu ca phe, bi dao" },
  "M3": { name: "L'Oreal VN", role: "Manufacturer", location: "Dong Nai, Vietnam", desc: "Tap doan my pham hang dau the gioi" },
  "M4": { name: "Rohto", role: "Manufacturer", location: "Binh Duong, Vietnam", desc: "Chuyen cac dong Sunplay, LipIce, Hada Labo" },
  "M5": { name: "Unilever VN", role: "Manufacturer", location: "Cu Chi, HCM", desc: "Tap doan da quoc gia (Pond's, Hazeline)" },
  "D1": { name: "DKSH Vietnam", role: "Distributor", location: "VSIP 1, Binh Duong", desc: "Tap doan dich vu phat trien thi truong" },
  "D2": { name: "Mesa Group", role: "Distributor", location: "Tan Binh, HCM", desc: "Nha phan phoi da kenh" },
  "D3": { name: "Thuy Loc Corp", role: "Distributor", location: "District 3, HCM", desc: "Phan phoi my pham cao cap" },
  "D4": { name: "Phu Thai Group", role: "Distributor", location: "Ha Noi", desc: "Phan phoi mien Bac" },
  "R1": { name: "Hasaki", role: "Retailer", location: "District 10, HCM", desc: "Chuoi cua hang my pham chinh hang" },
  "R2": { name: "Guardian", role: "Retailer", location: "District 1, HCM", desc: "Chuoi ban le suc khoe va sac dep" },
  "R3": { name: "Watsons", role: "Retailer", location: "Aeon Mall Tan Phu, HCM", desc: "Ban le my pham quoc te" },
  "C1": { name: "End Consumer", role: "Consumer", location: "Vietnam", desc: "Purchased Product" }
};

// 2. PRODUCTS & HISTORY (Merged from products.csv and history_prod.csv)
export const MOCK_DATABASE = {
  "SUNSCREEN-ROH-20251007-4E3": {
    id: "SUNSCREEN-ROH-20251007-4E3",
    name: "Sunplay Skin Aqua",
    brand: "Rohto",
    category: "Skincare",
    origin: "Vietnam",
    batch_number: "LOT-ROH-2510-744",
    expiry: "10/7/2027",
    certification: "GMP Standard",
    storage: "Tranh nhiet do cao",
    timeline: [
      { status: "Manufacturing", date: "10/7/2025 19:20", ownerCode: "M4", icon: "factory" },
      { status: "QC_Passed", date: "10/7/2025 23:20", ownerCode: "M4", icon: "check" },
      { status: "Packaged", date: "10/8/2025 1:20", ownerCode: "M4", icon: "package" },
      { status: "AtDistributor", date: "10/9/2025 1:20", ownerCode: "D2", icon: "truck" },
      { status: "AtRetailer", date: "10/11/2025 1:20", ownerCode: "R3", icon: "store" },
      { status: "Sold", date: "10/16/2025 1:20", ownerCode: "C1", icon: "cart" },
    ]
  },
  "CREAM-UNI-20250906-CGY": {
    id: "CREAM-UNI-20250906-CGY",
    name: "Pond's White Beauty",
    brand: "Unilever VN",
    category: "Skincare",
    origin: "Thailand",
    batch_number: "LOT-UNI-2509-797",
    expiry: "9/6/2027",
    certification: "Dermatologically Tested",
    storage: "Nhiet do phong",
    timeline: [
      { status: "Manufacturing", date: "9/6/2025 19:20", ownerCode: "M5", icon: "factory" },
    ]
  },
  "SCRUB-COC-20251114-PTA": {
    id: "SCRUB-COC-20251114-PTA",
    name: "Tay Da Chet Cafe",
    brand: "Cocoon VN",
    category: "Bodycare",
    origin: "Vietnam",
    batch_number: "LOT-COC-2511-131",
    expiry: "11/14/2027",
    certification: "Vegan Certified",
    storage: "Nhiet do phong",
    timeline: [
        { status: "Manufacturing", date: "11/14/2025 19:20", ownerCode: "M2", icon: "factory" },
        { status: "Packaged", date: "11/15/2025 1:20", ownerCode: "M2", icon: "package" }
    ]
  },
  "LIPBALM-COC-20251205-GL7": {
      id: "LIPBALM-COC-20251205-GL7",
      name: "Son Duong Dua",
      brand: "Cocoon VN",
      category: "Lipcare",
      origin: "Vietnam",
      batch_number: "LOT-COC-2512-499",
      expiry: "12/5/2027",
      certification: "Vegan Certified",
      storage: "Tranh anh nang truc tiep",
      timeline: [
          { status: "Manufacturing", date: "12/01/2025 10:00", ownerCode: "M2", icon: "factory" },
          { status: "QC_Passed", date: "12/01/2025 14:00", ownerCode: "M2", icon: "check" }
      ]
  }
};

// -----------------------------------------------------------------------------
// SERVICE FUNCTIONS
// -----------------------------------------------------------------------------

export const fetchBlockchainProduct = async (id) => {
  // 1. Check for Wallet
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }

  try {
    // 2. Connect to Provider (MetaMask)
    // Note: In Ethers v6, use BrowserProvider. In v5, use Web3Provider.
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // 3. Connect to Contract
    // We only need a 'Provider' (Read-only) for fetching data. 
    // If you were writing data (adding a product), you'd need a 'Signer':
    // const signer = await provider.getSigner();
    // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log(`Calling Smart Contract at ${CONTRACT_ADDRESS} for ID: ${id}`);
    
    // 4. Execute Call
    const data = await contract.getProduct(id);
    
    // 5. Parse Data
    const product = data[0];
    const history = data[1];

    if (!product.exists) {
        throw new Error("Product does not exist on the blockchain.");
    }

    // 6. Format for UI
    return {
      id: id,
      name: product.name,
      strength: product.strength,
      additives: product.additives,
      location: { 
          lat: 44.8378, // Mock coordinates (real apps usually fetch this from a geocoding API based on location name)
          lng: -0.5792, 
          name: product.originLocation 
      }, 
      origin: { 
        vineyard: product.originVineyard, 
        altitude: "N/A", 
        region: "N/A", 
        grape: "N/A" 
      },
      timeline: history.map(h => ({
        status: h.status,
        date: h.date,
        icon: h.icon
      }))
    };

  } catch (error) {
    console.error("Blockchain Service Error:", error);
    
    if (error.code === "CALL_EXCEPTION") {
        throw new Error("Smart Contract call failed. Check if ID exists or Contract Address is correct.");
    }
    if (error.code === "ACTION_REJECTED") {
        throw new Error("User rejected the connection request.");
    }
    
    throw error;
  }
};