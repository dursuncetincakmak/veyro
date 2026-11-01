import https from 'https';
import fs from 'fs';

// Known high-res fitness & portrait photos on Unsplash & Pexels
const candidateIds = [
  // Female Athletic Portraits & Fitness (Unsplash)
  "photo-1534528741775-53994a69daeb",
  "photo-1494790108377-be9c29b29330",
  "photo-1524504388940-b1c1722653e1",
  "photo-1517841905240-472988babdf9",
  "photo-1529626455594-4ff0802cfb7e",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1544005313-94ddf0286df2",
  "photo-1524502397800-2eeaad7c3fe5",
  "photo-1502680390469-be75c86b636f",
  "photo-1518611012118-696072aa579a",
  "photo-1540497077202-7c8a3999166f",
  "photo-1518310383802-640c2de311b2",
  "photo-1574680096145-d05b474e2155",
  "photo-1526506118085-60ce8714f8c5",
  "photo-1571019614242-c5c5dee9f50b",
  "photo-1541534741688-6078c6bfb5c5",
  "photo-1517836357463-d25dfeac3438",
  "photo-1534438327276-14e5300c3a48",
  "photo-1583454110551-21f2fa2afe61",
  "photo-1517838277536-f5f99be501cd",
  "photo-1581009146145-b5ef050c2e1e",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1500648767791-00dcc994a43e",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1539571696357-5a69c17a67c6",
  "photo-1501196354995-cbb51c65aaea",
  "photo-1492562080023-ab3db95bfbce",
  "photo-1522075469751-3a6694fb2f61",
  "photo-1534258936925-c58bed479fcb",
  "photo-1458312732998-763933ed4896",
  "photo-1627483298606-cf54c61779a9",
  "photo-1518214598173-1666bc921d66",
  "photo-1534367507873-d2d7e24c797f",
  "photo-1576678927484-cc907957088c",
  "photo-1584735935682-2f2b69dff9d2",
  "photo-1583454155184-870a1f63aebc",
  "photo-1579758629938-03607ccdbaba",
  "photo-1581009137042-c552e485697a",
  "photo-1594737625785-a6cbdabd333c",
  "photo-1599058945522-28d584b6f0ff",
  "photo-1599058917212-d750089bc07e",
  "photo-1599058917765-a780eda07a3e",
  "photo-1571731956672-f2b94d7dd0cb",
  "photo-1571732154690-f6d1c3e51772",
  "photo-1571731956672-f2b94d7dd0cb",
  "photo-1538805060514-97d9cc17730c",
  "photo-1548690312-e3b507d8c110",
  "photo-1518611012118-696072aa579a",
  "photo-1517344884509-a0c97ec11bcc",
  "photo-1517344884509-a0c97ec11bcc",
  "photo-1549576490-b0b4831dd60a",
  "photo-1550345332-09e3ac987658",
  "photo-1552674605-db6ffd4facb5",
  "photo-1554284126-aa88f22d8b74",
  "photo-1554344728-77cf90d9ed26",
  "photo-1561214078-f3247447da5e",
  "photo-1566241142559-40e1dab266c6",
  "photo-1567013127542-490d757e51fc",
  "photo-1571019613454-1cb2f99b2d8b",
  "photo-1571019613576-2b22c76fd955",
  "photo-1571019614242-c5c5dee9f50b",
  "photo-1571902943202-507ec2618e8f",
  "photo-1574680096145-d05b474e2155",
  "photo-1574680178050-55c6a6a96e0a",
  "photo-1575052814086-f385e2e2ad1b",
  "photo-1576678927484-cc907957088c",
  "photo-1577221084712-45b0445b2b00",
  "photo-1579758629938-03607ccdbaba",
  "photo-1581009137042-c552e485697a",
  "photo-1581009146145-b5ef050c2e1e",
  "photo-1583454110551-21f2fa2afe61",
  "photo-1583454155184-870a1f63aebc",
  "photo-1584735935682-2f2b69dff9d2",
  "photo-1584824486509-112e4181ff6b",
  "photo-1594381898411-846e7d193883",
  "photo-1594737625785-a6cbdabd333c",
  "photo-1599058917212-d750089bc07e",
  "photo-1599058917765-a780eda07a3e",
  "photo-1599058945522-28d584b6f0ff",
  "photo-1605296867304-46d5465a13f1",
  "photo-1605296867424-35fc25c9212a",
  "photo-1607962837359-597e8e4d219b",
  "photo-1616279967983-ec413476e824",
  "photo-1627483262268-9c2b5b2834b5",
  "photo-1627483297886-49710ea1fc22",
  "photo-1627483298606-cf54c61779a9"
];

// Pexels verified fitness photos
const pexelsIds = [
  "1552242", "4716814", "17210041", "29259725", "11183203", "25596879", "13030611", "8038623",
  "7900680", "2294400", "6550860", "903171", "3888405", "4720790", "9644820", "8874355",
  "15917308", "3838705", "16996376", "39635369", "32695898", "416778", "416717", "3757376",
  "3823076", "3757374", "3823039", "841130", "2294361", "1552249", "1552252", "1431282",
  "1552106", "1552103", "1552104", "1552256", "1552254", "2247179", "2261477", "2261485",
  "2261482", "2827400", "28080", "3076509", "3076516", "3112004", "3253501", "3289711",
  "3490348", "3768916", "3775164", "3775566", "3775593", "3775603", "3822906", "3823063",
  "3823086", "3823207", "3838937", "3838977", "3927389", "4058411", "414029", "4162451",
  "4162487", "4164761", "4325454", "4327024", "4327027", "4498574", "4498606", "4534689",
  "4662438", "4752861", "4753996", "4761792", "4944975", "5067741", "5327466", "6455823",
  "6455828", "6456141", "6456201", "6740822", "6855349", "703014", "703016", "791763",
  "863926", "863977", "863988", "864939", "866023", "868483", "868705", "868776",
  "1954524", "1954525", "1865131", "1756959", "1552248", "1552251", "1552253", "1229356",
  "116077", "116078", "116079", "703009", "703012", "703015", "669584", "669578",
  "669577", "669576", "669582", "669585", "669580", "416754", "416747", "414027",
  "3757377", "3757378", "3757380", "3757382", "3757384", "3757385", "3757388", "3757390",
  "3768593", "3768595", "3768596", "3768597", "3768598", "3768600", "3768602", "3768603",
  "3768605", "3768607", "3768609", "3768611", "3768613", "3768615", "3768617", "3768619",
  "3768725", "3768726", "3768728", "3768729", "3768731", "3768733", "3768734", "3768736",
  "3768738", "3768740", "3768742", "3768744", "3768745", "3768746", "3768748", "3768750"
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    }).on('error', () => resolve({ url, status: 0, ok: false })).end();
  });
}

async function run() {
  const unsplashUrls = candidateIds.map(id => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`);
  const pexelsUrls = pexelsIds.map(id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`);
  
  const allUrls = [...new Set([...unsplashUrls, ...pexelsUrls])];
  console.log(`Checking ${allUrls.length} photos...`);
  
  const results = await Promise.all(allUrls.map(checkUrl));
  const valid = results.filter(r => r.ok).map(r => r.url);
  console.log(`Valid: ${valid.length}/${allUrls.length}`);
  
  fs.writeFileSync('scratch/verified_photos.json', JSON.stringify(valid, null, 2));
  console.log('Saved valid URLs to scratch/verified_photos.json');
}

run();
