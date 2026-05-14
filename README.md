# 🧬 Peptide Designer

범용 펩타이드 설계·비교·최적화 도구.

- **잔기별 커스터마이징**: FA (포화/불포화/이산), Linker (PEG/AEEA/γGlu 등), D/L-form, 비천연 아미노산
- **📌 Pin & Compare**: 핀을 찍어 무제한 variant 실시간 비교 (MW, Albumin Kd, T½, Protease, Route, BBB, DL score)
- **PK/Stability**: Albumin binding → 반감기 예측, DPP-4/CPB risk, 투여경로 feasibility
- **BBB Shuttle**: Angiopep-2, RVG-29, dNP2 등 + Retro-inverso + Cleavable linker
- **구조 분석**: Helix wheel, Chou-Fasman SS prediction, AlphaFold3 CIF 업로드
- **범용 결합 스코어**: Charge/Hydrophobic complementarity, 상대 Kd 비교
- **AI 문헌 검색**: Anthropic API로 실측 Kd 문헌 자동 검색

---

## 🚀 배포 (Vercel, 5분)

```bash
git init && git add . && git commit -m "v29"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/peptide-designer.git
git push -u origin main
```

→ [vercel.com](https://vercel.com) → Import → Deploy

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:5173
```

## 변경 이력

- **V29**: 범용 펩타이드 도구로 전환. FAM19A5 전용 IC50 제거. Pin & Compare 시스템 도입.
- **V28**: FAM19A5/LRRC4B 억제 펩타이드 전용 도구.
