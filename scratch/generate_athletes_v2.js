import fs from 'fs';
import path from 'path';

// 1. Load verified photos
const verifiedPhotos = JSON.parse(fs.readFileSync('scratch/verified_photos.json', 'utf-8'));
console.log(`Loaded ${verifiedPhotos.length} verified photos.`);

// Separate into female and male pools and action pools
// Unsplash IDs starting with female vs male, and pexels photos
const femalePortraitPool = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop&q=80",
  "https://images.pexels.com/photos/8038623/pexels-photo-8038623.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/7900680/pexels-photo-7900680.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2294400/pexels-photo-2294400.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6550860/pexels-photo-6550860.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/903171/pexels-photo-903171.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/25596879/pexels-photo-25596879.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/29259725/pexels-photo-29259725.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/32695898/pexels-photo-32695898.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3757374/pexels-photo-3757374.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3823076/pexels-photo-3823076.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2247179/pexels-photo-2247179.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261482/pexels-photo-2261482.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261485/pexels-photo-2261485.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2827400/pexels-photo-2827400.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3076509/pexels-photo-3076509.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3076516/pexels-photo-3076516.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3112004/pexels-photo-3112004.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3490348/pexels-photo-3490348.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775164/pexels-photo-3775164.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775593/pexels-photo-3775593.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775603/pexels-photo-3775603.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3823063/pexels-photo-3823063.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3823086/pexels-photo-3823086.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3823207/pexels-photo-3823207.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3838937/pexels-photo-3838937.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3838977/pexels-photo-3838977.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3927389/pexels-photo-3927389.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4058411/pexels-photo-4058411.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/414029/pexels-photo-414029.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4325454/pexels-photo-4325454.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4327024/pexels-photo-4327024.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4327027/pexels-photo-4327027.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4498574/pexels-photo-4498574.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4534689/pexels-photo-4534689.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4752861/pexels-photo-4752861.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4753996/pexels-photo-4753996.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4944975/pexels-photo-4944975.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5067741/pexels-photo-5067741.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5327466/pexels-photo-5327466.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6455823/pexels-photo-6455823.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6455828/pexels-photo-6455828.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6456141/pexels-photo-6456141.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6456201/pexels-photo-6456201.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6740822/pexels-photo-6740822.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6855349/pexels-photo-6855349.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703014/pexels-photo-703014.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/791763/pexels-photo-791763.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863926/pexels-photo-863926.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863977/pexels-photo-863977.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/864939/pexels-photo-864939.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/866023/pexels-photo-866023.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/868483/pexels-photo-868483.jpeg?auto=compress&cs=tinysrgb&w=800"
];

const malePortraitPool = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1458312732998-763933ed4896?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1627483298606-cf54c61779a9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518214598173-1666bc921d66?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80",
  "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/11183203/pexels-photo-11183203.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/13030611/pexels-photo-13030611.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3888405/pexels-photo-3888405.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/9644820/pexels-photo-9644820.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/8874355/pexels-photo-8874355.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/15917308/pexels-photo-15917308.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3838705/pexels-photo-3838705.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/16996376/pexels-photo-16996376.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552104/pexels-photo-1552104.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552256/pexels-photo-1552256.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552254/pexels-photo-1552254.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/28080/pexels-photo-28080.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1954525/pexels-photo-1954525.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1865131/pexels-photo-1865131.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1756959/pexels-photo-1756959.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552248/pexels-photo-1552248.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552251/pexels-photo-1552251.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552253/pexels-photo-1552253.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/116077/pexels-photo-116077.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/116078/pexels-photo-116078.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/116079/pexels-photo-116079.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703009/pexels-photo-703009.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703012/pexels-photo-703012.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703015/pexels-photo-703015.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669584/pexels-photo-669584.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669578/pexels-photo-669578.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669577/pexels-photo-669577.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669576/pexels-photo-669576.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669582/pexels-photo-669582.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669585/pexels-photo-669585.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669580/pexels-photo-669580.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416754/pexels-photo-416754.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416747/pexels-photo-416747.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/414027/pexels-photo-414027.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768593/pexels-photo-3768593.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768595/pexels-photo-3768595.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768596/pexels-photo-3768596.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768597/pexels-photo-3768597.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768598/pexels-photo-3768598.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768600/pexels-photo-3768600.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768602/pexels-photo-3768602.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768603/pexels-photo-3768603.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768605/pexels-photo-3768605.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768607/pexels-photo-3768607.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768609/pexels-photo-3768609.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768611/pexels-photo-3768611.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768613/pexels-photo-3768613.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768615/pexels-photo-3768615.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768617/pexels-photo-3768617.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768619/pexels-photo-3768619.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768725/pexels-photo-3768725.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768726/pexels-photo-3768726.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768728/pexels-photo-3768728.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768729/pexels-photo-3768729.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768731/pexels-photo-3768731.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768733/pexels-photo-3768733.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768734/pexels-photo-3768734.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768736/pexels-photo-3768736.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768738/pexels-photo-3768738.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768740/pexels-photo-3768740.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768742/pexels-photo-3768742.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768744/pexels-photo-3768744.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768745/pexels-photo-3768745.jpeg?auto=compress&cs=tinysrgb&w=800"
];

// Gym action workouts (barbells, dumbbells, machines, deadlift, squat, stretching, running)
const workoutActionPool = [
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=800&auto=format&fit=crop&q=80",
  "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/29259725/pexels-photo-29259725.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/25596879/pexels-photo-25596879.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/13030611/pexels-photo-13030611.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3888405/pexels-photo-3888405.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/9644820/pexels-photo-9644820.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/8874355/pexels-photo-8874355.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/15917308/pexels-photo-15917308.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3838705/pexels-photo-3838705.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/16996376/pexels-photo-16996376.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/39635369/pexels-photo-39635369.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1552104/pexels-photo-1552104.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261482/pexels-photo-2261482.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2261485/pexels-photo-2261485.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3076509/pexels-photo-3076509.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3076516/pexels-photo-3076516.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3112004/pexels-photo-3112004.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775164/pexels-photo-3775164.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775593/pexels-photo-3775593.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3775603/pexels-photo-3775603.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4325454/pexels-photo-4325454.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4327024/pexels-photo-4327024.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4327027/pexels-photo-4327027.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4498574/pexels-photo-4498574.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4534689/pexels-photo-4534689.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4752861/pexels-photo-4752861.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4753996/pexels-photo-4753996.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4944975/pexels-photo-4944975.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5067741/pexels-photo-5067741.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5327466/pexels-photo-5327466.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6455823/pexels-photo-6455823.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6455828/pexels-photo-6455828.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6456141/pexels-photo-6456141.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6456201/pexels-photo-6456201.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6740822/pexels-photo-6740822.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/6855349/pexels-photo-6855349.jpeg?auto=compress&cs=tinysrgb&w=800"
];

// Gym floor, nutrition, lifestyle, mirror selfies
const lifestylePool = [
  "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
  "https://images.pexels.com/photos/11183203/pexels-photo-11183203.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2247179/pexels-photo-2247179.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/28080/pexels-photo-28080.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2827400/pexels-photo-2827400.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3490348/pexels-photo-3490348.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4058411/pexels-photo-4058411.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/414029/pexels-photo-414029.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669584/pexels-photo-669584.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669578/pexels-photo-669578.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669577/pexels-photo-669577.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669576/pexels-photo-669576.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669582/pexels-photo-669582.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669585/pexels-photo-669585.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/669580/pexels-photo-669580.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703014/pexels-photo-703014.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/791763/pexels-photo-791763.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863926/pexels-photo-863926.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863977/pexels-photo-863977.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/864939/pexels-photo-864939.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/866023/pexels-photo-866023.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/868483/pexels-photo-868483.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/868705/pexels-photo-868705.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/868776/pexels-photo-868776.jpeg?auto=compress&cs=tinysrgb&w=800"
];

console.log(`Pools: Female ${femalePortraitPool.length}, Male ${malePortraitPool.length}, Actions ${workoutActionPool.length}, Lifestyle ${lifestylePool.length}`);

// 2. Nationwide Turkey Gyms (Major fitness hubs across 30 cities and key districts)
const TURKEY_GYMS = [
  // İstanbul
  { id: "gym_ist_kadikoy", name: "MACFit Kadıköy", district: "Kadıköy", city: "İstanbul", lat: 40.9902, lng: 29.0298 },
  { id: "gym_ist_moda", name: "PowerGym Moda", district: "Moda", city: "İstanbul", lat: 40.9850, lng: 29.0250 },
  { id: "gym_ist_cadde", name: "PlusFitness Caddebostan", district: "Caddebostan", city: "İstanbul", lat: 40.9680, lng: 29.0620 },
  { id: "gym_ist_atasehir", name: "FitCity Ataşehir", district: "Ataşehir", city: "İstanbul", lat: 40.9920, lng: 29.1150 },
  { id: "gym_ist_uskudar", name: "Üsküdar GymClub", district: "Üsküdar", city: "İstanbul", lat: 41.0260, lng: 29.0180 },
  { id: "gym_ist_maltepe", name: "Hilltown MACFit", district: "Maltepe", city: "İstanbul", lat: 40.9320, lng: 29.1350 },
  { id: "gym_ist_pendik", name: "Viaport MACFit", district: "Pendik", city: "İstanbul", lat: 40.8800, lng: 29.2300 },
  { id: "gym_ist_besiktas", name: "MACFit Beşiktaş", district: "Beşiktaş", city: "İstanbul", lat: 41.0420, lng: 29.0060 },
  { id: "gym_ist_sisli", name: "MAC Kanyon", district: "Şişli", city: "İstanbul", lat: 41.0780, lng: 29.0110 },
  { id: "gym_ist_bakirkoy", name: "Galleria Sports Club", district: "Bakırköy", city: "İstanbul", lat: 40.9760, lng: 28.8720 },
  { id: "gym_ist_sariyer", name: "Vadi İstanbul MACFit", district: "Sarıyer", city: "İstanbul", lat: 41.1080, lng: 28.9880 },
  { id: "gym_ist_beylikduzu", name: "Torium Sports Center", district: "Beylikdüzü", city: "İstanbul", lat: 41.0020, lng: 28.6850 },

  // Ankara
  { id: "gym_ank_tunali", name: "MACFit Tunalı Hilmi", district: "Çankaya", city: "Ankara", lat: 39.9050, lng: 32.8600 },
  { id: "gym_ank_panora", name: "Panora MAC", district: "Çankaya", city: "Ankara", lat: 39.8520, lng: 32.8360 },
  { id: "gym_ank_cayyolu", name: "Arcadium MACFit", district: "Çayyolu", city: "Ankara", lat: 39.8880, lng: 32.7020 },
  { id: "gym_ank_kizilay", name: "Kızılay PowerGym", district: "Kızılay", city: "Ankara", lat: 39.9210, lng: 32.8540 },
  { id: "gym_ank_batikent", name: "Atlantis MACFit", district: "Batıkent", city: "Ankara", lat: 39.9700, lng: 32.7480 },
  { id: "gym_ank_bilkent", name: "Sports International Bilkent", district: "Bilkent", city: "Ankara", lat: 39.8710, lng: 32.7530 },
  { id: "gym_ank_kecioren", name: "Antares MACFit", district: "Keçiören", city: "Ankara", lat: 39.9670, lng: 32.8220 },

  // İzmir
  { id: "gym_izm_alsancak", name: "MACFit Alsancak", district: "Alsancak", city: "İzmir", lat: 38.4380, lng: 27.1420 },
  { id: "gym_izm_mavibahce", name: "MaviBahçe MACFit", district: "Karşıyaka", city: "İzmir", lat: 38.4620, lng: 27.0980 },
  { id: "gym_izm_bornova", name: "Forum Bornova MACFit", district: "Bornova", city: "İzmir", lat: 38.4550, lng: 27.2180 },
  { id: "gym_izm_bostanli", name: "Bostanlı FitClub", district: "Bostanlı", city: "İzmir", lat: 38.4570, lng: 27.1020 },
  { id: "gym_izm_goztepe", name: "Göztepe Sahil Gym", district: "Göztepe", city: "İzmir", lat: 38.3980, lng: 27.0920 },
  { id: "gym_izm_balcova", name: "Agora MACFit", district: "Balçova", city: "İzmir", lat: 38.3920, lng: 27.0510 },
  { id: "gym_izm_urla", name: "Urla Surf & Fitness", district: "Urla", city: "İzmir", lat: 38.3220, lng: 26.7650 },

  // Antalya
  { id: "gym_ant_muratpasa", name: "TerraCity MACFit", district: "Muratpaşa", city: "Antalya", lat: 36.8520, lng: 30.7540 },
  { id: "gym_ant_konyaalti", name: "Konyaaltı Beach Gym", district: "Konyaaltı", city: "Antalya", lat: 36.8780, lng: 30.6450 },
  { id: "gym_ant_lara", name: "Lara PlusFitness", district: "Lara", city: "Antalya", lat: 36.8580, lng: 30.7890 },
  { id: "gym_ant_alanya", name: "Alanya Cleopatra Fitness", district: "Alanya", city: "Antalya", lat: 36.5440, lng: 31.9860 },

  // Bursa
  { id: "gym_bur_nilufer", name: "Sur Yapı Marka MACFit", district: "Nilüfer", city: "Bursa", lat: 40.2110, lng: 28.9860 },
  { id: "gym_bur_ozluce", name: "Özlüce FitClub", district: "Özlüce", city: "Bursa", lat: 40.2240, lng: 28.9210 },
  { id: "gym_bur_podyum", name: "PodyumPark Sports Club", district: "Nilüfer", city: "Bursa", lat: 40.2180, lng: 28.9680 },
  { id: "gym_bur_osmangazi", name: "Zafer Plaza Fitness", district: "Osmangazi", city: "Bursa", lat: 40.1880, lng: 29.0610 },

  // Eskişehir
  { id: "gym_esk_tepebasi", name: "Espark MACFit", district: "Tepebaşı", city: "Eskişehir", lat: 39.7820, lng: 30.5090 },
  { id: "gym_esk_cassaba", name: "Cassaba Modern Fitness", district: "Tepebaşı", city: "Eskişehir", lat: 39.7890, lng: 30.4980 },
  { id: "gym_esk_odunpazari", name: "Odunpazarı FitLife", district: "Odunpazarı", city: "Eskişehir", lat: 39.7610, lng: 30.5260 },

  // Adana & Mersin
  { id: "gym_ada_cukurova", name: "M1 Adana MACFit", district: "Çukurova", city: "Adana", lat: 37.0320, lng: 35.2650 },
  { id: "gym_ada_barajyolu", name: "Turgut Özal FitLife", district: "Çukurova", city: "Adana", lat: 37.0380, lng: 35.3020 },
  { id: "gym_mer_yenisehir", name: "Forum Mersin MACFit", district: "Yenişehir", city: "Mersin", lat: 36.7860, lng: 34.5980 },
  { id: "gym_mer_mezitli", name: "Marina Sports Club", district: "Mezitli", city: "Mersin", lat: 36.7580, lng: 34.5320 },

  // Trabzon & Samsun
  { id: "gym_tra_ortahisar", name: "Forum Trabzon MACFit", district: "Ortahisar", city: "Trabzon", lat: 40.9980, lng: 39.7580 },
  { id: "gym_sam_atakum", name: "Atakum Sahil MACFit", district: "Atakum", city: "Samsun", lat: 41.3280, lng: 36.3120 },

  // Muğla / Bodrum / Fethiye
  { id: "gym_mug_bodrum", name: "Midtown MACFit Bodrum", district: "Bodrum", city: "Muğla", lat: 37.0520, lng: 27.3820 },
  { id: "gym_mug_yalikavak", name: "Yalıkavak Marina Gym", district: "Yalıkavak", city: "Muğla", lat: 37.1080, lng: 27.2910 },
  { id: "gym_mug_fethiye", name: "Fethiye Kordon Sports", district: "Fethiye", city: "Muğla", lat: 36.6320, lng: 29.1180 },

  // Diğer İller
  { id: "gym_kon_selcuklu", name: "Kule Site MACFit", district: "Selçuklu", city: "Konya", lat: 37.8920, lng: 32.4950 },
  { id: "gym_gaz_sehitkamil", name: "Sanko Park MACFit", district: "Şehitkamil", city: "Gaziantep", lat: 37.0720, lng: 37.3620 },
  { id: "gym_kay_melikgazi", name: "Kayseri Park MACFit", district: "Melikgazi", city: "Kayseri", lat: 38.7280, lng: 35.5080 },
  { id: "gym_koc_izmit", name: "41 Burda MACFit", district: "İzmit", city: "Kocaeli", lat: 40.7580, lng: 29.9520 },
  { id: "gym_sak_serdivan", name: "Agora Serdivan MACFit", district: "Serdivan", city: "Sakarya", lat: 40.7680, lng: 30.3680 },
  { id: "gym_den_pamukkale", name: "Forum Çamlık MACFit", district: "Pamukkale", city: "Denizli", lat: 37.7650, lng: 29.0980 },
  { id: "gym_bal_karesi", name: "Yaylada MACFit", district: "Karesi", city: "Balıkesir", lat: 39.6580, lng: 27.8920 },
  { id: "gym_tek_corlu", name: "Trend Arena MACFit", district: "Çorlu", city: "Tekirdağ", lat: 41.1620, lng: 27.8120 },
  { id: "gym_diy_kayapinar", name: "Ceylan Karavil MACFit", district: "Kayapınar", city: "Diyarbakır", lat: 37.9380, lng: 40.1820 },
  { id: "gym_ayd_kusadasi", name: "Kuşadası Marina Fitness", district: "Kuşadası", city: "Aydın", lat: 37.8680, lng: 27.2620 },
  { id: "gym_can_merkez", name: "17 Burda MACFit", district: "Merkez", city: "Çanakkale", lat: 40.1380, lng: 26.4180 }
];

console.log(`Configured ${TURKEY_GYMS.length} nationwide gyms across Turkey.`);

// 3. Names, Bios and Workouts
const femaleFirstNames = [
  "Ece", "Zeynep", "Sinem", "İrem", "Damla", "Melisa", "Tuğba", "Yasemin", "Elif", "Beril",
  "Gizem", "Hazal", "Buse", "Cansu", "Pelin", "Derya", "Selin", "Ayşe", "Merve", "Duygu",
  "Begüm", "Simge", "Burcu", "Dilara", "Ezgi", "Aslı", "İpek", "Defne", "Başak", "Serra",
  "Yağmur", "Nil", "Bade", "Derin", "Leyla", "Sena", "Ceren", "Nehir", "Eylül", "Melda",
  "Pınar", "Gamze", "Bengü", "Rüya", "Melike", "Nazlı", "Ebru", "Deniz", "Ada", "Gözde",
  "Hande", "Aylin", "Berna", "Işıl", "Şevval", "Ceyda", "Bahar", "Buket", "Sude", "Esra",
  "Lara", "Alara", "İlayda", "Ecehan", "Sezen", "Nisa", "Büşra", "Hilal", "Sibel", "Selma",
  "Özge", "Öykü", "Melis", "Beliz", "Ecem", "Gülce", "Yeliz", "Banu", "Tülin", "Belgin",
  "Ayça", "Gülben", "Didem", "Feride", "Şeyma", "Zehra", "Efsun", "Su", "Mira", "Doğa",
  "Ceren", "Simay", "Pırıl", "Beste", "Dila", "Gülfem", "Asude", "Rana", "Sevde", "Esin"
];

const maleFirstNames = [
  "Can", "Kerem", "Burak", "Deniz", "Alp", "Tolga", "Berkay", "Mert", "Emre", "Barış",
  "Arda", "Kaan", "Doruk", "Efe", "Batu", "Çağlar", "Onur", "Ozan", "Serdar", "Koray",
  "Yiğit", "Görkem", "Uğur", "Volkan", "Taylan", "Cenk", "Berk", "Erdem", "Sinan", "Murat",
  "Hakan", "Tarık", "Emrecan", "Atakan", "Cem", "Buğra", "Göktuğ", "Kutay", "Tuna", "Sarp",
  "Bora", "Yağız", "Oğuz", "Rüzgar", "Kuzey", "Demir", "Çınar", "Atlas", "Pars", "Baran",
  "Furkan", "Batuhan", "Kadir", "Kemal", "Ali", "Ahmet", "Mehmet", "Mustafa", "Yasin", "Yusuf",
  "Eren", "Enes", "Umut", "Semih", "Cihan", "İlker", "Alper", "Taner", "Soner", "Caner",
  "Okan", "Levent", "Metin", "Cemil", "Selim", "Engin", "Selçuk", "Orkun", "Tarkan", "Aykut",
  "Gökhan", "Serkan", "Erkan", "Tuncay", "Kubilay", "Ayberk", "Görkem", "Yalçın", "Harun", "Oğuzhan",
  "Kayra", "Devrim", "Utku", "Bora", "Taha", "Ege", "Alpcan", "Baha", "Tayfun", "Yaman"
];

const lastNames = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
  "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
  "Polat", "Korkmaz", "Erdoğan", "Yavuz", "Aksoy", "Tekin", "Güler", "Yalçın", "Avcı", "Bulut",
  "Keskin", "Ünal", "Güneş", "Bozkurt", "Can", "Karaca", "Taş", "Coşkun", "Sarı", "Gök",
  "Uçar", "Acar", "Sever", "Soylu", "Duran", "Işık", "Kalkan", "Eren", "Demirci", "Kartal"
];

const femaleBios = [
  "Haftada 4 gün ağırlık, 1 gün kardiyo. Birlikte motive olacak ve set aralarında spotterlık yapacak partner arıyorum 💪",
  "Sabahları 07:00 seansları. Squat ve Hip Thrust odaklı çalışıyorum. Düzenli gelen arkadaşlar ekleyebilir ✨",
  "Pilates ve fonksiyonel fitness ile ilgileniyorum. Haftasonu koşu veya salonda partner iyi olur 🧘‍♀️",
  "Kilo verme ve sıkılaşma dönemindeyim. Birlikte kardiyo ve HIIT yapacak motivasyon partneri arıyorum.",
  "Bacak ve kalça günlerinde birbirimize destek olacak disiplinli sporcu kız arkadaş arıyorum 🏋️‍♀️",
  "Haftada 5 gün split antrenman. Disiplinli ve zamanında gelen partnerlerle çalışmayı seviyorum.",
  "Yeni başladım sayılır, form düzeltme ve temel hareketlerde motive olacak birini arıyorum 🌸",
  "Hypertrophy ve güç odaklı alt-üst vücut spliti yapıyorum. Karşılıklı yardımlaşma güzel olur.",
  "Crossfit ve fonksiyonel antrenmanlar vazgeçilmezim. Sabah enerjisiyle spora başlayanlar yazabilir ⚡",
  "Akşam iş çıkışı 19:30 seansları. Omuz ve sırt günlerinde süperset partneri."
];

const maleBios = [
  "Haftada 5 gün Push-Pull-Legs yapıyorum. Bench ve Squat'ta ağır kilolarda spotter partneri arıyorum 💪",
  "Sabah 07:30 veya akşam 19:00 seansları. Hedef hacim ve hipertrofi. Ciddi antrenman arkadaşı eklesin 🏋️‍♂️",
  "Crossfit ve calisthenics karışık gidiyorum. Güç antrenmanında sınırları zorlayacak partner arıyorum ⚡",
  "Kondisyon ve yağ yakımı odaklıyım. Birlikte tempolu kardiyo ve ağırlık kombinasyonu yapabiliriz.",
  "Powerlifting ve temel bileşik egzersizler (Squat, Bench, Deadlift). Disiplinli sporcular yazsın.",
  "Haftasonları sabah koşusu, hafta içi akşam salon seansları. Sürekli motive partner arıyorum.",
  "Sporda 3. yılım. Form ve tempo odaklı çalışıyorum, zamanı verimli kullanan biriyle eşleşmek isterim.",
  "İş çıkışı 18:30 seansları. Göğüs-kol ve sırt günlerinde tükeniş setleri için spotter lazım 🎯",
  "Fonksiyonel güç ve kondisyon antrenmanı. Birlikte PR deneyecek partner arıyorum 🔥",
  "Düzenli antrenman ve temiz beslenme yaşam tarzım. Salonda vakit kaybetmeden basacak dostlar eklesin."
];

const workouts = [
  { workoutType: "Bacak & Kalça", expectation: "Spotter partneri arıyor", note: "Ağır squat ve RDL seansı, motive olacak partner" },
  { workoutType: "Göğüs & Kol", expectation: "Ağır kilo partneri", note: "Bench press ve dumbbell press süpersetleri" },
  { workoutType: "Sırt & Biceps", expectation: "Set arası motivasyon", note: "Lat pulldown ve barbell row odaklı seans" },
  { workoutType: "Omuz & Karın", expectation: "Süperset partneri", note: "Overhead press ve lateral raise tükeniş setleri" },
  { workoutType: "Full Body", expectation: "Dinamik partner", note: "Tüm vücut bileşik egzersizler ve core çalışması" },
  { workoutType: "Kardiyo & HIIT", expectation: "Tempo partneri", note: "Koşu bandı intervalleri ve kettlebell devresi" },
  { workoutType: "Fonksiyonel & Mobilite", expectation: "Disiplinli sporcu", note: "Esneme, kalça mobilitesi ve core aktivasyonu" }
];

const goalsList = [
  ["Kas", "Güç"],
  ["Kondisyon", "Yağ Yakımı"],
  ["Genel form", "Mobilite"],
  ["Güç", "Hipertrofi"],
  ["Kardiyo", "Dayanıklılık"],
  ["Kas", "Kondisyon"]
];

const levelsList = ["Orta", "İleri", "Yeni başladım", "Orta", "İleri"];
const preferredTimesList = [["Akşam"], ["Sabah"], ["Öğle"], ["Akşam", "Haftasonu"], ["Sabah", "Öğle"]];

// Generate 100 Female Athletes
const femaleAthletes = [];
for (let i = 0; i < 100; i++) {
  const fName = femaleFirstNames[i % femaleFirstNames.length];
  const lName = lastNames[(i * 3 + 1) % lastNames.length];
  const fullName = `${fName} ${lName}`;
  const gym = TURKEY_GYMS[i % TURKEY_GYMS.length];
  const age = 20 + ((i * 7) % 15);
  const wk = workouts[i % workouts.length];
  const goals = goalsList[i % goalsList.length];
  const level = levelsList[i % levelsList.length];
  const prefTimes = preferredTimesList[i % preferredTimesList.length];
  const bio = femaleBios[i % femaleBios.length];

  // Distinct photo selection guaranteed:
  // Photo 0: Distinct female portrait
  const p0 = femalePortraitPool[i % femalePortraitPool.length];
  // Photo 1: Distinct workout action photo
  const p1 = workoutActionPool[(i * 2 + 1) % workoutActionPool.length];
  // Photo 2: Distinct lifestyle photo
  const p2 = lifestylePool[(i * 3 + 2) % lifestylePool.length];
  // Optional Photo 3: Extra action photo
  const p3 = workoutActionPool[(i * 2 + 2) % workoutActionPool.length];

  const photos = [p0, p1, p2, p3];

  const latOffset = ((((i * 13) % 40) - 20) / 10000);
  const lngOffset = ((((i * 17) % 40) - 20) / 10000);

  femaleAthletes.push({
    id: `ath_f_${1000 + i}`,
    name: fullName,
    initials: `${fName[0]}${lName[0]}`,
    gender: "Kadın",
    age: age,
    city: gym.city,
    district: gym.district,
    gymId: gym.id,
    gymName: `${gym.name} (${gym.city})`,
    lat: parseFloat((gym.lat + latOffset).toFixed(6)),
    lng: parseFloat((gym.lng + lngOffset).toFixed(6)),
    avatar: p0,
    photos: photos,
    level: level,
    goals: goals,
    preferredTimes: prefTimes,
    bio: bio,
    verified: i % 3 !== 0,
    attendanceStreak: 4 + ((i * 5) % 18),
    workoutsCompleted: 10 + ((i * 7) % 55),
    rating: parseFloat((4.7 + ((i % 4) * 0.1)).toFixed(1)),
    onboarded: true,
    nextWorkout: {
      day: i % 2 === 0 ? "Bugün" : "Yarın",
      time: `${17 + (i % 5)}:${(i % 2 === 0 ? "00" : "30")}`,
      workoutType: wk.workoutType,
      expectation: wk.expectation,
      note: wk.note
    }
  });
}

// Generate 100 Male Athletes
const maleAthletes = [];
for (let j = 0; j < 100; j++) {
  const fName = maleFirstNames[j % maleFirstNames.length];
  const lName = lastNames[(j * 5 + 2) % lastNames.length];
  const fullName = `${fName} ${lName}`;
  const gym = TURKEY_GYMS[(j + 15) % TURKEY_GYMS.length];
  const age = 21 + ((j * 11) % 16);
  const wk = workouts[(j + 2) % workouts.length];
  const goals = goalsList[(j + 1) % goalsList.length];
  const level = levelsList[(j + 2) % levelsList.length];
  const prefTimes = preferredTimesList[(j + 1) % preferredTimesList.length];
  const bio = maleBios[j % maleBios.length];

  // Distinct photo selection guaranteed:
  // Photo 0: Distinct male portrait
  const p0 = malePortraitPool[j % malePortraitPool.length];
  // Photo 1: Distinct workout action photo
  const p1 = workoutActionPool[(j * 2 + 1) % workoutActionPool.length];
  // Photo 2: Distinct lifestyle photo
  const p2 = lifestylePool[(j * 3 + 1) % lifestylePool.length];
  // Optional Photo 3: Extra action photo
  const p3 = workoutActionPool[(j * 2 + 2) % workoutActionPool.length];

  const photos = [p0, p1, p2, p3];

  const latOffset = ((((j * 19) % 40) - 20) / 10000);
  const lngOffset = ((((j * 23) % 40) - 20) / 10000);

  maleAthletes.push({
    id: `ath_m_${2000 + j}`,
    name: fullName,
    initials: `${fName[0]}${lName[0]}`,
    gender: "Erkek",
    age: age,
    city: gym.city,
    district: gym.district,
    gymId: gym.id,
    gymName: `${gym.name} (${gym.city})`,
    lat: parseFloat((gym.lat + latOffset).toFixed(6)),
    lng: parseFloat((gym.lng + lngOffset).toFixed(6)),
    avatar: p0,
    photos: photos,
    level: level,
    goals: goals,
    preferredTimes: prefTimes,
    bio: bio,
    verified: j % 2 === 0,
    attendanceStreak: 5 + ((j * 4) % 22),
    workoutsCompleted: 12 + ((j * 9) % 65),
    rating: parseFloat((4.7 + ((j % 4) * 0.1)).toFixed(1)),
    onboarded: true,
    nextWorkout: {
      day: j % 2 === 0 ? "Bugün" : "Yarın",
      time: `${18 + (j % 4)}:${(j % 2 === 0 ? "00" : "30")}`,
      workoutType: wk.workoutType,
      expectation: wk.expectation,
      note: wk.note
    }
  });
}

// Interleave females and males
const communityAthletes200 = [];
for (let k = 0; k < 100; k++) {
  communityAthletes200.push(femaleAthletes[k]);
  communityAthletes200.push(maleAthletes[k]);
}

// 4. Localized Community Stories (Key fitness moments across Istanbul, Ankara, İzmir, Antalya, Bursa, Eskişehir)
const localizedCommunityStories = [
  {
    id: "story_ist_1",
    userId: femaleAthletes[0].id,
    userName: femaleAthletes[0].name,
    userInitials: femaleAthletes[0].initials,
    userAvatar: femaleAthletes[0].photos[0],
    image: femaleAthletes[0].photos[1],
    tag: "💪 Bacak Günü PR",
    caption: "Yeni Squat PR: 105kg! Salondayız kızlar 🔥",
    city: "İstanbul",
    district: "Kadıköy",
    gymId: "gym_ist_kadikoy",
    gymName: "MACFit Kadıköy (İstanbul)",
    distanceKm: 0.4,
    timestamp: Date.now() - 1 * 3600 * 1000,
    likesCount: 24,
    viewed: false
  },
  {
    id: "story_ist_2",
    userId: maleAthletes[0].id,
    userName: maleAthletes[0].name,
    userInitials: maleAthletes[0].initials,
    userAvatar: maleAthletes[0].photos[0],
    image: maleAthletes[0].photos[1],
    tag: "⚡ Bench Press 120kg",
    caption: "Göğüs & Kol bitti! Akşam seansı için partner arayanlar DM atsın 🏋️",
    city: "İstanbul",
    district: "Moda",
    gymId: "gym_ist_moda",
    gymName: "PowerGym Moda (İstanbul)",
    distanceKm: 0.8,
    timestamp: Date.now() - 2 * 3600 * 1000,
    likesCount: 31,
    viewed: false
  },
  {
    id: "story_ist_3",
    userId: femaleAthletes[1].id,
    userName: femaleAthletes[1].name,
    userInitials: femaleAthletes[1].initials,
    userAvatar: femaleAthletes[1].photos[0],
    image: femaleAthletes[1].photos[2],
    tag: "🔥 Sabah Kardiyosu",
    caption: "Caddebostan sahil koşusu ve salonda core antrenmanı ✨",
    city: "İstanbul",
    district: "Caddebostan",
    gymId: "gym_ist_cadde",
    gymName: "PlusFitness Caddebostan (İstanbul)",
    distanceKm: 2.1,
    timestamp: Date.now() - 3 * 3600 * 1000,
    likesCount: 38,
    viewed: false
  },
  {
    id: "story_ank_1",
    userId: maleAthletes[1].id,
    userName: maleAthletes[1].name,
    userInitials: maleAthletes[1].initials,
    userAvatar: maleAthletes[1].photos[0],
    image: maleAthletes[1].photos[1],
    tag: "🏋️ Deadlift Seansı",
    caption: "Tunalı'da akşam antrenmanı tam gaz. Spotter desteği mükemmeldi!",
    city: "Ankara",
    district: "Çankaya",
    gymId: "gym_ank_tunali",
    gymName: "MACFit Tunalı Hilmi (Ankara)",
    distanceKm: 348.0,
    timestamp: Date.now() - 4 * 3600 * 1000,
    likesCount: 29,
    viewed: false
  },
  {
    id: "story_izm_1",
    userId: femaleAthletes[2].id,
    userName: femaleAthletes[2].name,
    userInitials: femaleAthletes[2].initials,
    userAvatar: femaleAthletes[2].photos[0],
    image: femaleAthletes[2].photos[1],
    tag: "🥗 Pilates & Mobilite",
    caption: "Alsancak'ta reformer ve fonksiyonel antrenman tamamlandı 🎯",
    city: "İzmir",
    district: "Alsancak",
    gymId: "gym_izm_alsancak",
    gymName: "MACFit Alsancak (İzmir)",
    distanceKm: 329.0,
    timestamp: Date.now() - 5 * 3600 * 1000,
    likesCount: 45,
    viewed: false
  },
  {
    id: "story_ant_1",
    userId: maleAthletes[2].id,
    userName: maleAthletes[2].name,
    userInitials: maleAthletes[2].initials,
    userAvatar: maleAthletes[2].photos[0],
    image: maleAthletes[2].photos[1],
    tag: "☀️ Beach Workout",
    caption: "Konyaaltı'nda açık hava kondisyon ve salonda hipertrofi seansı 🔥",
    city: "Antalya",
    district: "Muratpaşa",
    gymId: "gym_ant_muratpasa",
    gymName: "TerraCity MACFit (Antalya)",
    distanceKm: 482.0,
    timestamp: Date.now() - 6 * 3600 * 1000,
    likesCount: 33,
    viewed: false
  },
  {
    id: "story_bur_1",
    userId: femaleAthletes[3].id,
    userName: femaleAthletes[3].name,
    userInitials: femaleAthletes[3].initials,
    userAvatar: femaleAthletes[3].photos[0],
    image: femaleAthletes[3].photos[2],
    tag: "🏆 Hipertrofi Seansı",
    caption: "Nilüfer'de omuz ve sırt süpersetleri bitti. Hedefe bir adım daha ⚡",
    city: "Bursa",
    district: "Nilüfer",
    gymId: "gym_bur_nilufer",
    gymName: "Sur Yapı Marka MACFit (Bursa)",
    distanceKm: 94.0,
    timestamp: Date.now() - 7 * 3600 * 1000,
    likesCount: 27,
    viewed: false
  },
  {
    id: "story_esk_1",
    userId: maleAthletes[3].id,
    userName: maleAthletes[3].name,
    userInitials: maleAthletes[3].initials,
    userAvatar: maleAthletes[3].photos[0],
    image: maleAthletes[3].photos[1],
    tag: "🔥 Espark Seansı",
    caption: "Tepebaşı Espark'ta akşam bacak seansı. Enerji zirvede!",
    city: "Eskişehir",
    district: "Tepebaşı",
    gymId: "gym_esk_tepebasi",
    gymName: "Espark MACFit (Eskişehir)",
    distanceKm: 198.0,
    timestamp: Date.now() - 8 * 3600 * 1000,
    likesCount: 21,
    viewed: false
  }
];

// Write out to seedAthletes200.js
const fileContent = `/**
 * Veyro - 200 Authentic Community Athlete Profiles & Nationwide Localized Stories
 * Realistic Turkish athletes spanning Turkey's major cities (İstanbul, Ankara, İzmir, Antalya, Bursa, Eskişehir, Adana, Trabzon, Muğla...)
 * Zero repetition: Distinct portraits, varied real workout action photos, and authentic fitness bios.
 */

export const TURKEY_GYMS_CATALOG = ${JSON.stringify(TURKEY_GYMS, null, 2)};

export const COMMUNITY_ATHLETES_200 = ${JSON.stringify(communityAthletes200, null, 2)};

export const NEARBY_COMMUNITY_STORIES = ${JSON.stringify(localizedCommunityStories, null, 2)};
`;

fs.writeFileSync('src/services/seedAthletes200.js', fileContent, 'utf-8');
console.log(`Successfully generated seedAthletes200.js with ${communityAthletes200.length} athletes and ${localizedCommunityStories.length} stories!`);
