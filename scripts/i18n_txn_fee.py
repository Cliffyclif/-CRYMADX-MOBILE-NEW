#!/usr/bin/env python3
"""Rename the user-facing fee label from "Network Fee" to "Transaction Fee"
across all locales. Targets withdraw.networkFee / buy.networkFee / tx.networkFee
(keys kept; only the display value changes). QA #6."""
import json, glob, os

TRANSLATIONS = {
    'en': 'Transaction Fee',
    'ar': 'رسوم المعاملة',
    'de': 'Transaktionsgebühr',
    'es': 'Comisión de transacción',
    'fr': 'Frais de transaction',
    'hi': 'लेन-देन शुल्क',
    'it': 'Commissione di transazione',
    'ja': '取引手数料',
    'ko': '거래 수수료',
    'nl': 'Transactiekosten',
    'pt': 'Taxa de transação',
    'ru': 'Комиссия за транзакцию',
    'tr': 'İşlem ücreti',
    'zh': '交易手续费',
}
SECTIONS = ['withdraw', 'buy', 'tx']

base = os.path.join(os.path.dirname(__file__), '..', 'src', 'locales')
for path in sorted(glob.glob(os.path.join(base, '*.json'))):
    lang = os.path.splitext(os.path.basename(path))[0]
    label = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    changed = 0
    for sec in SECTIONS:
        if isinstance(data.get(sec), dict) and 'networkFee' in data[sec]:
            if data[sec]['networkFee'] != label:
                data[sec]['networkFee'] = label
                changed += 1
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
    print(f'{lang}: {changed} key(s) → "{label}"')
