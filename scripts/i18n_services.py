#!/usr/bin/env python3
"""Add services.item.*, services.cat.*, services.noMatch + common.edit/done to all locales."""
import json, glob, os, collections

LOC = os.path.join(os.path.dirname(__file__), '..', 'src', 'locales')

ITEM_KEYS = ['deposit','buyCrypto','p2pTrading','spotTrade','convert','activity','markets','send',
             'earnHub','staking','savings','autoInvest','vault','myNfts','nftMarket','card','wallet',
             'saved','txHistory','kyc','security','apiKeys','rewardsHub','referEarn','priceAlerts',
             'announcements','helpCenter','myTickets','contact','systemStatus']
CAT_KEYS = ['recommended','buyCrypto','trade','earn','nft','account','engagement','support']

# Per-language values: items (30), cats (8), noMatch, edit, done.
T = {
 'en': {'i':['Deposit','Buy Crypto','P2P Trading','Spot Trade','Convert','Activity','Markets','Send','Earn Hub','Staking','Savings','Auto-Invest','Vault','My NFTs','NFT Market','Card','Wallet','Saved','Tx History','KYC','Security','API Keys','Rewards Hub','Refer & Earn','Price Alerts','Announcements','Help Center','My Tickets','Contact','System Status'],
        'c':['Recommended','Buy Crypto','Trade','Earn','NFT','Account','Engagement','Support'],
        'nm':'No services match "{{q}}"','ed':'Edit','dn':'Done'},
 'es': {'i':['Depositar','Comprar Cripto','Trading P2P','Trading Spot','Convertir','Actividad','Mercados','Enviar','Centro Earn','Staking','Ahorros','Auto-Inversión','Bóveda','Mis NFT','Mercado NFT','Tarjeta','Billetera','Guardados','Historial','KYC','Seguridad','Claves API','Recompensas','Refiere y Gana','Alertas de Precio','Anuncios','Centro de Ayuda','Mis Tickets','Contacto','Estado del Sistema'],
        'c':['Recomendado','Comprar Cripto','Operar','Ganar','NFT','Cuenta','Participación','Soporte'],
        'nm':'Ningún servicio coincide con "{{q}}"','ed':'Editar','dn':'Hecho'},
 'fr': {'i':['Dépôt','Acheter Crypto','Trading P2P','Trading Spot','Convertir','Activité','Marchés','Envoyer','Centre Earn','Staking','Épargne','Auto-Invest','Coffre','Mes NFT','Marché NFT','Carte','Portefeuille','Enregistrés','Historique','KYC','Sécurité','Clés API','Récompenses','Parrainer et Gagner','Alertes de Prix','Annonces','Centre d\'Aide','Mes Tickets','Contact','État du Système'],
        'c':['Recommandé','Acheter Crypto','Trader','Gagner','NFT','Compte','Engagement','Support'],
        'nm':'Aucun service ne correspond à "{{q}}"','ed':'Modifier','dn':'Terminé'},
 'de': {'i':['Einzahlen','Krypto Kaufen','P2P-Handel','Spot-Handel','Umwandeln','Aktivität','Märkte','Senden','Earn-Hub','Staking','Sparen','Auto-Invest','Tresor','Meine NFTs','NFT-Markt','Karte','Wallet','Gespeichert','Verlauf','KYC','Sicherheit','API-Schlüssel','Belohnungen','Empfehlen & Verdienen','Preisalarme','Ankündigungen','Hilfecenter','Meine Tickets','Kontakt','Systemstatus'],
        'c':['Empfohlen','Krypto Kaufen','Handeln','Verdienen','NFT','Konto','Engagement','Support'],
        'nm':'Keine Dienste passen zu "{{q}}"','ed':'Bearbeiten','dn':'Fertig'},
 'it': {'i':['Deposita','Compra Cripto','Trading P2P','Trading Spot','Converti','Attività','Mercati','Invia','Centro Earn','Staking','Risparmi','Auto-Invest','Caveau','I Miei NFT','Mercato NFT','Carta','Portafoglio','Salvati','Cronologia','KYC','Sicurezza','Chiavi API','Premi','Invita e Guadagna','Avvisi di Prezzo','Annunci','Centro Assistenza','I Miei Ticket','Contatto','Stato del Sistema'],
        'c':['Consigliati','Compra Cripto','Trada','Guadagna','NFT','Account','Coinvolgimento','Supporto'],
        'nm':'Nessun servizio corrisponde a "{{q}}"','ed':'Modifica','dn':'Fatto'},
 'pt': {'i':['Depositar','Comprar Cripto','Trading P2P','Trading Spot','Converter','Atividade','Mercados','Enviar','Central Earn','Staking','Poupança','Auto-Invest','Cofre','Meus NFTs','Mercado NFT','Cartão','Carteira','Salvos','Histórico','KYC','Segurança','Chaves API','Recompensas','Indique e Ganhe','Alertas de Preço','Anúncios','Central de Ajuda','Meus Tickets','Contato','Status do Sistema'],
        'c':['Recomendado','Comprar Cripto','Negociar','Ganhar','NFT','Conta','Engajamento','Suporte'],
        'nm':'Nenhum serviço corresponde a "{{q}}"','ed':'Editar','dn':'Concluído'},
 'nl': {'i':['Storten','Crypto Kopen','P2P-Handel','Spot-Handel','Omzetten','Activiteit','Markten','Verzenden','Earn-Hub','Staking','Sparen','Auto-Invest','Kluis','Mijn NFT\'s','NFT-Markt','Kaart','Portemonnee','Opgeslagen','Geschiedenis','KYC','Beveiliging','API-sleutels','Beloningen','Verwijs & Verdien','Prijsalerts','Aankondigingen','Helpcentrum','Mijn Tickets','Contact','Systeemstatus'],
        'c':['Aanbevolen','Crypto Kopen','Handelen','Verdienen','NFT','Account','Betrokkenheid','Ondersteuning'],
        'nm':'Geen diensten komen overeen met "{{q}}"','ed':'Bewerken','dn':'Klaar'},
 'ru': {'i':['Пополнить','Купить крипту','P2P-торговля','Спот-торговля','Конвертировать','Активность','Рынки','Отправить','Центр Earn','Стейкинг','Сбережения','Автоинвест','Хранилище','Мои NFT','NFT-маркет','Карта','Кошелёк','Сохранённые','История','KYC','Безопасность','API-ключи','Награды','Пригласить и заработать','Оповещения о ценах','Объявления','Центр помощи','Мои тикеты','Контакты','Статус системы'],
        'c':['Рекомендуемые','Купить крипту','Торговать','Зарабатывать','NFT','Аккаунт','Активность','Поддержка'],
        'nm':'Нет сервисов по запросу "{{q}}"','ed':'Изменить','dn':'Готово'},
 'tr': {'i':['Yatır','Kripto Al','P2P Ticaret','Spot İşlem','Dönüştür','Etkinlik','Piyasalar','Gönder','Earn Merkezi','Staking','Tasarruf','Oto-Yatırım','Kasa','NFT\'lerim','NFT Pazarı','Kart','Cüzdan','Kayıtlı','Geçmiş','KYC','Güvenlik','API Anahtarları','Ödüller','Davet Et & Kazan','Fiyat Uyarıları','Duyurular','Yardım Merkezi','Taleplerim','İletişim','Sistem Durumu'],
        'c':['Önerilen','Kripto Al','İşlem','Kazan','NFT','Hesap','Etkileşim','Destek'],
        'nm':'"{{q}}" ile eşleşen hizmet yok','ed':'Düzenle','dn':'Tamam'},
 'zh': {'i':['充值','购买加密货币','P2P交易','现货交易','兑换','活动','市场','发送','赚币中心','质押','储蓄','自动投资','金库','我的NFT','NFT市场','卡片','钱包','已保存','交易记录','KYC','安全','API密钥','奖励中心','推荐赚币','价格提醒','公告','帮助中心','我的工单','联系我们','系统状态'],
        'c':['推荐','购买加密货币','交易','赚币','NFT','账户','互动','支持'],
        'nm':'没有匹配 "{{q}}" 的服务','ed':'编辑','dn':'完成'},
 'ja': {'i':['入金','暗号資産を買う','P2P取引','現物取引','コンバート','アクティビティ','マーケット','送金','Earnハブ','ステーキング','貯蓄','自動積立','ボールト','マイNFT','NFTマーケット','カード','ウォレット','保存済み','取引履歴','KYC','セキュリティ','APIキー','リワード','紹介して稼ぐ','価格アラート','お知らせ','ヘルプセンター','マイチケット','お問い合わせ','システム状況'],
        'c':['おすすめ','暗号資産を買う','取引','稼ぐ','NFT','アカウント','エンゲージメント','サポート'],
        'nm':'「{{q}}」に一致するサービスがありません','ed':'編集','dn':'完了'},
 'ko': {'i':['입금','암호화폐 구매','P2P 거래','현물 거래','전환','활동','마켓','보내기','earn 허브','스테이킹','저축','자동 투자','볼트','내 NFT','NFT 마켓','카드','지갑','저장됨','거래 내역','KYC','보안','API 키','리워드','추천하고 적립','가격 알림','공지사항','고객센터','내 티켓','문의','시스템 상태'],
        'c':['추천','암호화폐 구매','거래','적립','NFT','계정','참여','지원'],
        'nm':'"{{q}}"와 일치하는 서비스가 없습니다','ed':'편집','dn':'완료'},
 'ar': {'i':['إيداع','شراء العملات','تداول P2P','تداول فوري','تحويل','النشاط','الأسواق','إرسال','مركز الربح','الستاكينغ','المدخرات','استثمار تلقائي','الخزنة','NFT الخاصة بي','سوق NFT','البطاقة','المحفظة','المحفوظة','السجل','KYC','الأمان','مفاتيح API','المكافآت','ادعُ واربح','تنبيهات الأسعار','الإعلانات','مركز المساعدة','تذاكري','اتصل بنا','حالة النظام'],
        'c':['موصى به','شراء العملات','تداول','اربح','NFT','الحساب','التفاعل','الدعم'],
        'nm':'لا توجد خدمات تطابق "{{q}}"','ed':'تعديل','dn':'تم'},
 'hi': {'i':['जमा करें','क्रिप्टो खरीदें','P2P ट्रेडिंग','स्पॉट ट्रेड','कन्वर्ट','गतिविधि','मार्केट','भेजें','Earn हब','स्टेकिंग','बचत','ऑटो-इन्वेस्ट','वॉल्ट','मेरे NFT','NFT मार्केट','कार्ड','वॉलेट','सहेजे गए','इतिहास','KYC','सुरक्षा','API कुंजियाँ','रिवॉर्ड्स','रेफर करें और कमाएँ','मूल्य अलर्ट','घोषणाएँ','सहायता केंद्र','मेरे टिकट','संपर्क','सिस्टम स्थिति'],
        'c':['अनुशंसित','क्रिप्टो खरीदें','ट्रेड','कमाएँ','NFT','खाता','सहभागिता','सहायता'],
        'nm':'"{{q}}" से मेल खाती कोई सेवा नहीं','ed':'संपादित करें','dn':'पूर्ण'},
}

def lang_of(path):
    return os.path.splitext(os.path.basename(path))[0]

for path in glob.glob(os.path.join(LOC, '*.json')):
    lang = lang_of(path)
    tr = T.get(lang, T['en'])  # fall back to English for any unlisted locale
    with open(path, encoding='utf-8') as f:
        d = json.load(f, object_pairs_hook=collections.OrderedDict)
    svc = d.setdefault('services', collections.OrderedDict())
    svc['item'] = collections.OrderedDict((k, tr['i'][n]) for n, k in enumerate(ITEM_KEYS))
    svc['cat'] = collections.OrderedDict((k, tr['c'][n]) for n, k in enumerate(CAT_KEYS))
    svc['noMatch'] = tr['nm']
    common = d.setdefault('common', collections.OrderedDict())
    common.setdefault('edit', tr['ed'])
    common.setdefault('done', tr['dn'])
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'updated {lang}: +{len(ITEM_KEYS)} items, +{len(CAT_KEYS)} cats')
print('done')
