#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Add the missing CheckoutModal strings to buy.* in every locale (they showed
raw key names like 'Opened In Browser Title' because the keys were absent and the
auto-humanizer defeats the code-side `|| fallback`). Idempotent."""
import json, glob, os

K = {
 'continueInBrowserTitle': {'en':'Continue in your browser','ar':'تابع في متصفحك','de':'Im Browser fortfahren','es':'Continúa en tu navegador','fr':'Continuer dans le navigateur','hi':'अपने ब्राउज़र में जारी रखें','it':'Continua nel browser','ja':'ブラウザで続行','ko':'브라우저에서 계속','nl':'Ga verder in je browser','pt':'Continuar no navegador','ru':'Продолжить в браузере','tr':'Tarayıcıda devam et','zh':'在浏览器中继续'},
 'continueInBrowserBody': {'en':"Checkout can't fully load inside the app. Tap Open in browser to finish — your details pre-fill there.",'ar':'لا يمكن تحميل الدفع داخل التطبيق. اضغط فتح في المتصفح لإكمال العملية — ستُملأ بياناتك تلقائياً.','de':'Die Kasse kann in der App nicht vollständig laden. Tippe auf Im Browser öffnen — deine Daten werden vorausgefüllt.','es':'El pago no carga del todo en la app. Toca Abrir en el navegador para terminar — tus datos se rellenan allí.','fr':'Le paiement ne se charge pas entièrement dans l’app. Touchez Ouvrir dans le navigateur — vos infos se pré-remplissent.','hi':'चेकआउट ऐप में पूरी तरह लोड नहीं हो सकता। पूरा करने के लिए ब्राउज़र में खोलें दबाएं — आपकी जानकारी वहां भर जाएगी।','it':'Il checkout non si carica del tutto nell’app. Tocca Apri nel browser per finire — i tuoi dati si precompilano.','ja':'アプリ内ではチェックアウトを完全に読み込めません。ブラウザで開くをタップして完了してください。情報は自動入力されます。','ko':'앱 내에서 결제가 완전히 로드되지 않습니다. 브라우저에서 열기를 눌러 완료하세요 — 정보는 자동 입력됩니다.','nl':'De checkout laadt niet volledig in de app. Tik op Openen in browser om af te ronden — je gegevens worden vooraf ingevuld.','pt':'O checkout não carrega totalmente no app. Toque em Abrir no navegador para concluir — seus dados são preenchidos lá.','ru':'Оплата не загружается полностью в приложении. Нажмите Открыть в браузере — ваши данные подставятся автоматически.','tr':'Ödeme uygulamada tam yüklenemiyor. Tarayıcıda Aç’a dokunup tamamlayın — bilgileriniz orada doldurulur.','zh':'结账无法在应用内完整加载。点击在浏览器中打开以完成——您的信息会自动填入。'},
 'openInBrowser': {'en':'Open in browser','ar':'فتح في المتصفح','de':'Im Browser öffnen','es':'Abrir en el navegador','fr':'Ouvrir dans le navigateur','hi':'ब्राउज़र में खोलें','it':'Apri nel browser','ja':'ブラウザで開く','ko':'브라우저에서 열기','nl':'Openen in browser','pt':'Abrir no navegador','ru':'Открыть в браузере','tr':'Tarayıcıda aç','zh':'在浏览器中打开'},
 'openedInBrowserTitle': {'en':'Checkout opened in your browser','ar':'تم فتح الدفع في متصفحك','de':'Kasse im Browser geöffnet','es':'Pago abierto en tu navegador','fr':'Paiement ouvert dans le navigateur','hi':'चेकआउट आपके ब्राउज़र में खुला','it':'Checkout aperto nel browser','ja':'チェックアウトをブラウザで開きました','ko':'브라우저에서 결제가 열렸습니다','nl':'Checkout geopend in je browser','pt':'Checkout aberto no navegador','ru':'Оплата открыта в браузере','tr':'Ödeme tarayıcıda açıldı','zh':'结账已在浏览器中打开'},
 'openedInBrowserBody': {'en':"Complete your payment in the new window. Your details are pre-filled. Come back here when you're done.",'ar':'أكمل الدفع في النافذة الجديدة. بياناتك مُعبأة مسبقاً. عُد إلى هنا عند الانتهاء.','de':'Schließe die Zahlung im neuen Fenster ab. Deine Daten sind vorausgefüllt. Komm danach zurück.','es':'Completa el pago en la nueva ventana. Tus datos están rellenados. Vuelve aquí al terminar.','fr':'Terminez le paiement dans la nouvelle fenêtre. Vos infos sont pré-remplies. Revenez ici ensuite.','hi':'नई विंडो में अपना भुगतान पूरा करें। आपकी जानकारी पहले से भरी है। पूरा होने पर यहां लौटें।','it':'Completa il pagamento nella nuova finestra. I tuoi dati sono precompilati. Torna qui al termine.','ja':'新しいウィンドウで支払いを完了してください。情報は入力済みです。完了したらここに戻ってください。','ko':'새 창에서 결제를 완료하세요. 정보는 입력되어 있습니다. 완료 후 여기로 돌아오세요.','nl':'Rond je betaling af in het nieuwe venster. Je gegevens zijn ingevuld. Kom hier terug als je klaar bent.','pt':'Conclua o pagamento na nova janela. Seus dados estão preenchidos. Volte aqui ao terminar.','ru':'Завершите оплату в новом окне. Ваши данные подставлены. Вернитесь сюда после оплаты.','tr':'Ödemeyi yeni pencerede tamamlayın. Bilgileriniz dolu. Bitince buraya dönün.','zh':'在新窗口中完成付款。您的信息已填好。完成后请返回这里。'},
 'reopenCheckout': {'en':'Reopen checkout','ar':'إعادة فتح الدفع','de':'Kasse erneut öffnen','es':'Reabrir el pago','fr':'Rouvrir le paiement','hi':'चेकआउट फिर खोलें','it':'Riapri il checkout','ja':'チェックアウトを再度開く','ko':'결제 다시 열기','nl':'Checkout opnieuw openen','pt':'Reabrir checkout','ru':'Открыть оплату снова','tr':'Ödemeyi yeniden aç','zh':'重新打开结账'},
 'transactionSuccessful': {'en':'Transaction successful','ar':'تمت المعاملة بنجاح','de':'Transaktion erfolgreich','es':'Transacción exitosa','fr':'Transaction réussie','hi':'लेनदेन सफल','it':'Transazione riuscita','ja':'取引が成功しました','ko':'거래 성공','nl':'Transactie geslaagd','pt':'Transação concluída','ru':'Транзакция выполнена','tr':'İşlem başarılı','zh':'交易成功'},
 'transactionFailed': {'en':'Transaction failed','ar':'فشلت المعاملة','de':'Transaktion fehlgeschlagen','es':'Transacción fallida','fr':'Échec de la transaction','hi':'लेनदेन विफल','it':'Transazione non riuscita','ja':'取引に失敗しました','ko':'거래 실패','nl':'Transactie mislukt','pt':'Transação falhou','ru':'Транзакция не удалась','tr':'İşlem başarısız','zh':'交易失败'},
 'refreshingCheckout': {'en':'Refreshing checkout…','ar':'جارٍ تحديث الدفع…','de':'Kasse wird aktualisiert…','es':'Actualizando el pago…','fr':'Actualisation du paiement…','hi':'चेकआउट रिफ्रेश हो रहा है…','it':'Aggiornamento checkout…','ja':'チェックアウトを更新中…','ko':'결제 새로고침 중…','nl':'Checkout vernieuwen…','pt':'Atualizando checkout…','ru':'Обновление оплаты…','tr':'Ödeme yenileniyor…','zh':'正在刷新结账…'},
 'tryEmbedAnyway': {'en':'Try the embed anyway','ar':'جرّب التضمين على أي حال','de':'Trotzdem einbetten','es':'Intentar incrustarlo igual','fr':'Essayer l’intégration quand même','hi':'फिर भी एम्बेड आज़माएं','it':'Prova comunque l’embed','ja':'それでも埋め込みを試す','ko':'그래도 임베드 시도','nl':'Toch insluiten proberen','pt':'Tentar incorporar mesmo assim','ru':'Всё равно встроить','tr':'Yine de göm','zh':'仍然尝试内嵌'},
}

base = os.path.join(os.path.dirname(__file__), '..', 'src', 'locales')
for path in sorted(glob.glob(os.path.join(base, '*.json'))):
    lang = os.path.splitext(os.path.basename(path))[0]
    data = json.load(open(path, encoding='utf-8'))
    buy = data.setdefault('buy', {})
    n = 0
    for key, tr in K.items():
        v = tr.get(lang, tr['en'])
        if buy.get(key) != v:
            buy[key] = v; n += 1
    if n:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2); f.write('\n')
    print(f'{lang}: +{n}')
