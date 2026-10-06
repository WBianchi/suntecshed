import { PrismaClient } from "../src/generated/prisma/index.js";
const p = new PrismaClient();
const M = {
"Suporte Magnético Dobrável De 360° Para Celular Para Carro": "Foldable 360° Magnetic Phone Holder for Car",
"Carrinho de Controle Remoto Gira 360° Carrinho Maluco": "360° Rotating RC Stunt Car",
"Modelador Cachos Automático 3 Em 1 Temperatura Bivolt 32 mm": "Automatic 3-in-1 Hair Curler, Bivolt, 32mm",
"Sapateira Organizadora 3 Andares Empilhável Dobrável Caixa": "Foldable Stackable 3-Tier Shoe Rack Organizer",
"Caixa de Som JBL Clip 5, Bluetooth, Preto": "JBL Clip 5 Bluetooth Speaker, Black",
"Luminaria Lampada Spot Sensor Presença Indução Inteligente": "Smart Motion Sensor LED Spotlight Lamp",
"Mini Ring Light Selfie Com Luz De Led Para Celular Cores Aleatórias": "Mini LED Selfie Ring Light for Phone, Random Colors",
"Caixa de Som Subwoofer ley-1916 3W USB Preto LED RGB Gamer": "LEY-1916 Subwoofer Speaker 3W USB, Black RGB LED Gaming",
"Kit 3 Organizadores de Escritório, Brinquedoteca e Quarto Transparente 3L, 5L e 10L": "3-Piece Clear Storage Organizer Set, 3L / 5L / 10L",
"Faca De Caça Pesca Churrasco Luxo Fulltang Inox G61": "G61 Full Tang Stainless Steel Hunting, Fishing & BBQ Knife",
"Fruteira De Mesa 2 Andares Em Metal E Madeira Organizador De Frutas E Legumes": "2-Tier Metal & Wood Fruit and Vegetable Stand",
"Mini Balança De Alta Precisão Digital De Bolso 0,1g Até 500g": "Mini Digital Pocket Scale, 0.1g to 500g",
"Mini Soprador Ar Secador Turbo Jet Fan Poderosa Velocidade": "Mini Turbo Jet Fan Air Blower, High Speed",
"Mesa Bilhar Sinuca Infantil Portátil Snooker Kit Completo": "Portable Kids Pool & Snooker Table, Complete Kit",
"Grupo Vip Mentoria - C7TECNOLOGIAS": "VIP Group Mentorship - C7TECHNOLOGIES",
"Aparador Cortador de Pelos 2 em 1 KM-6511 Nariz e Orelhas": "KM-6511 2-in-1 Nose & Ear Hair Trimmer",
"Caneta Terapêutica Acupuntura Elétrica Estimula Pontos Fisio Cor Prateado PilhasAA": "Electric Acupuncture Therapy Pen, Silver, AA Batteries",
"Kit Animais Selvagens De Borracha Brinquedo Wild Animal": "Rubber Wild Animals Toy Set",
"Bateria Externa Power Bank 10000mah Pn-951 Pineng": "PINENG PN-951 Power Bank 10000mAh",
"Caixa De Som Potente Pc Notebook Subwoofer Para Computador 6w Usb P2 Alto Falante De Mesa": "Powerful PC & Laptop Speaker, 6W USB P2 Subwoofer, Desktop",
"Câmera De Segurança Wifi Smart Camera Ip Dual Camera Com Resolução 1080p Branco/preto": "Smart WiFi IP Dual Security Camera 1080p, White/Black",
"Formas Com 3 Assadeira Bandeja Aço Inoxidável Forno": "3-Piece Stainless Steel Baking Tray Set",
"Suporte Case Capa Celular À Prova D'água Gps P/ Moto Bike LE-030D": "LE-030D Waterproof Phone Case Mount for Moto & Bike",
"Brinco Bandeira Do Brasil Copa Do Mundo Plástico": "World Cup Brazil Flag Earrings, Plastic",
"Rolos Papel Etiqueta Lacuna P/impressora Térmica Portátil Cor Colorida": "Label Paper Rolls for Portable Thermal Printer, Colored",
"Chave De Roda Telescópica 17x19x21x23mm Alongável Universal": "Telescopic Lug Wrench 17x19x21x23mm, Universal",
"Fone De Ouvido In-ear Sem Fio Jbl Wave Beam Preto": "JBL Wave Beam Wireless In-Ear Earbuds, Black",
"Luminária Solar Arandela 30 Leds Parede Com Sensor Presença": "Solar Wall Light 30 LED with Motion Sensor",
"Controle Game Pad Free Fire Pubg Garena Call Of Duty Fifa 20": "Game Pad Controller for Free Fire, PUBG, Garena, Call of Duty, FIFA 20",
"Garrafa Termica Magsafe Fitness Suporte Smartphone 800ml": "800ml Thermal Bottle with MagSafe Phone Holder",
"Mini Luminaria De Mesa Flexível 3 Cor Led Abajur Sem Fio Com Porta Caneta E Celular": "Mini Flexible Table Lamp, 3-Color LED, Pen & Phone Holder",
"Mini Adaptador Usb Wifi N 300mbps 2.4ghz Tl-wn823n": "TL-WN823N Mini USB WiFi Adapter N 300Mbps 2.4GHz",
"Máscara Para Cílios A Prova D’Água 2X1 17g": "Waterproof 2-in-1 Eyelash Mascara 17g",
"Molinete AFG30": "AFG30 Fishing Reel",
"Fire Tv 4k MAX 16gb Alexa Controle de Voz": "Fire TV 4K Max 16GB with Alexa Voice Remote",
"Canetinha acrilica À prova d'agua waterproof água cores": "Waterproof Acrylic Markers, Assorted Colors",
"Pelúcia De Natal Rena Com Cachecol Vermelho": "Christmas Reindeer Plush with Red Scarf",
"Microfone Bluetooth Karaoke Sem Fio Youtuber Reporter Cores": "Wireless Bluetooth Karaoke Microphone for Youtuber & Reporter",
"Pisca Pisca Led Luz De Natal 100 LEDS 8 Funções 9 Metros Branco Led e Colorido": "Christmas LED String Lights 100 LEDs, 8 Modes, 9m, White & Colored",
"Smartwatch Revenger RG-U9 Ultra 9 49mm Preto Android iOS Resistente Água": "Revenger RG-U9 Ultra 9 49mm Smartwatch, Black, Water Resistant",
"Suporte Apoiador De Celular Mesa Tripé Selfie Regulagem 360°": "Desk Phone Stand & Tripod for Selfie, 360° Adjustable",
"Ventilador Com Luz Led, 3- Lâmpada Moderna Para Smart E2": "Fan with LED Light, Modern Smart Lamp E2",
};
const prods = await p.product.findMany({ select: { id: true, name: true } });
let ok = 0; const naoAchou = [];
for (const pr of prods) {
  const novo = M[pr.name];
  if (!novo) { naoAchou.push(pr.name); continue; }
  await p.product.update({ where: { id: pr.id }, data: { name: novo } });
  ok++;
}
console.log("traduzidos:", ok, "de", prods.length);
if (naoAchou.length) { console.log("NAO CASARAM:"); naoAchou.forEach(n => console.log("  -", n)); }
const conf = await p.product.findMany({ orderBy: { createdAt: "asc" }, select: { name: true } });
console.log("--- amostra ---"); conf.slice(0, 8).forEach(c => console.log("  ", c.name));
await p.$disconnect();
