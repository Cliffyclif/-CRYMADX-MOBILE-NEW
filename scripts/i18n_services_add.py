#!/usr/bin/env python3
"""Add the missing Services-launcher items (AI + settings) to services.item.* in
every locale, so the new catalog entries translate. Idempotent."""
import json, glob, os

# key -> { lang: translation }
ITEMS = {
    'aiAssistant': {'en':'CrymadX AI','ar':'مساعد الذكاء','de':'CrymadX KI','es':'IA CrymadX','fr':'IA CrymadX','hi':'CrymadX एआई','it':'IA CrymadX','ja':'CrymadX AI','ko':'CrymadX AI','nl':'CrymadX AI','pt':'IA CrymadX','ru':'CrymadX ИИ','tr':'CrymadX Yapay Zekâ','zh':'CrymadX AI'},
    'aiVoice': {'en':'AI Voice','ar':'صوت الذكاء','de':'KI-Stimme','es':'Voz IA','fr':'Voix IA','hi':'एआई वॉइस','it':'Voce IA','ja':'AI音声','ko':'AI 음성','nl':'AI-stem','pt':'Voz IA','ru':'ИИ-голос','tr':'Yapay Ses','zh':'AI语音'},
    'aiSettings': {'en':'AI Settings','ar':'إعدادات الذكاء','de':'KI-Einstellungen','es':'Ajustes IA','fr':'Réglages IA','hi':'एआई सेटिंग्स','it':'Impostazioni IA','ja':'AI設定','ko':'AI 설정','nl':'AI-instellingen','pt':'Definições IA','ru':'Настройки ИИ','tr':'Yapay Zekâ Ayarları','zh':'AI设置'},
    'theme': {'en':'Theme','ar':'السمة','de':'Design','es':'Tema','fr':'Thème','hi':'थीम','it':'Tema','ja':'テーマ','ko':'테마','nl':'Thema','pt':'Tema','ru':'Тема','tr':'Tema','zh':'主题'},
    'language': {'en':'Language','ar':'اللغة','de':'Sprache','es':'Idioma','fr':'Langue','hi':'भाषा','it':'Lingua','ja':'言語','ko':'언어','nl':'Taal','pt':'Idioma','ru':'Язык','tr':'Dil','zh':'语言'},
    'notifications': {'en':'Notifications','ar':'الإشعارات','de':'Benachrichtigungen','es':'Notificaciones','fr':'Notifications','hi':'सूचनाएं','it':'Notifiche','ja':'通知','ko':'알림','nl':'Meldingen','pt':'Notificações','ru':'Уведомления','tr':'Bildirimler','zh':'通知'},
    'currency': {'en':'Currency','ar':'العملة','de':'Währung','es':'Moneda','fr':'Devise','hi':'मुद्रा','it':'Valuta','ja':'通貨','ko':'통화','nl':'Valuta','pt':'Moeda','ru':'Валюта','tr':'Para Birimi','zh':'货币'},
    'developer': {'en':'Developer','ar':'المطور','de':'Entwickler','es':'Desarrollador','fr':'Développeur','hi':'डेवलपर','it':'Sviluppatore','ja':'開発者','ko':'개발자','nl':'Ontwikkelaar','pt':'Programador','ru':'Разработчик','tr':'Geliştirici','zh':'开发者'},
}

base = os.path.join(os.path.dirname(__file__), '..', 'src', 'locales')
for path in sorted(glob.glob(os.path.join(base, '*.json'))):
    lang = os.path.splitext(os.path.basename(path))[0]
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    item = data.setdefault('services', {}).setdefault('item', {})
    added = 0
    for key, tr in ITEMS.items():
        val = tr.get(lang, tr['en'])
        if item.get(key) != val:
            item[key] = val
            added += 1
    if added:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
    print(f'{lang}: +{added}')
