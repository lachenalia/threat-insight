# Data Architecture

## 1. Overview

이 문서는 **threat-insight**의 데이터 아키텍처를 정의한다.

본 아키텍처의 목표는 다음과 같다:

- 원천 데이터(NVD 등)와 가공된 설명 데이터를 명확히 분리
- 설명 생성 과정의 재현성 및 추적 가능성 확보
- 향후 UI, API, 자동화 파이프라인 확장에 유연하게 대응

---

## 2. High-level Data Flow

```
[Source]
   ↓
[Raw Data]
   ↓ (normalize)
[Canonical]
   ↓ (explain)
[User-Friendly Explanation]
   ↓
[API / UI / Export]
```

각 단계는 **불변 데이터(raw)** 와 **파생 데이터(derived)** 를 구분하여 저장한다.

---

## 3. Data Layers

### 3.1 Raw Layer (원본 데이터)

외부 소스에서 수집한 데이터를 **가공 없이** 저장한다.

**특징**

- 수정 불가 (append-only)
- 재수집 / 재처리 시 기준점 역할

**예시 필드**

```json
{
  "source": "NVD",
  "id": "CVE-2024-12345",
  "raw_payload": {
    /* original json */
  },
  "fetched_at": "2026-01-10T10:00:00Z"
}
```

---

### 3.2 Canonical Layer (정규화 데이터)

다양한 Raw Source 를 정규화한 계층.

**책임**

- 필드 명 통일
- 불필요한 중첩 제거
- 분석/설명에 필요한 최소 정보 유지

**핵심 필드**

```json
{
  "id": "CVE-2024-12345",
  "summary": "Buffer overflow in ...",
  "cvss": {
    "score": 9.8,
    "vector": "AV:N/AC:L/..."
  },
  "affected_products": [
    {
      "name": "log4j",
      "version_range": "< 2.17"
    }
  ],
  "published_at": "2024-11-01"
}
```

---

### 3.3 Explanation Layer (설명 데이터)

사람이 이해하기 쉬운 형태로 **의미를 해석한 결과물**.

이 레이어는 AI 또는 규칙 기반 로직으로 생성된다.

**중요 원칙**

- Canonical Layer를 절대 수정하지 않음
- 설명은 언제든 재생성 가능해야 함

**예시 구조**

```json
{
  "id": "CVE-2024-12345",
  "audience": "developer",
  "explanation": {
    "one_line": "외부 공격자가 인증 없이 서버를 장악할 수 있는 취약점입니다.",
    "why_it_matters": "이 취약점이 악용되면...",
    "what_can_happen": ["원격 코드 실행", "데이터 유출"],
    "how_to_check": "현재 사용 중인 라이브러리 버전을 확인하세요.",
    "how_to_fix": ["2.17 이상으로 업그레이드", "임시 완화 설정 적용"]
  },
  "generated_by": "gpt",
  "generated_at": "2026-01-10T10:05:00Z"
}
```

---

## 4. Audience Dimension

설명 데이터는 **대상 사용자(audience)** 에 따라 분리된다.

권장 audience 값:

- `manager`
- `developer`
- `security`

각 audience는 **같은 Source에도 다른 설명 레코드**를 가진다.

---

## 5. Versioning Strategy

설명 품질 개선을 위해 **버전 관리**가 필요하다.

```json
{
  "explanation_version": "v1.2",
  "prompt_hash": "a9f3...",
  "model": "gpt-4o"
}
```

이를 통해 다음이 가능해진다:

- 설명 결과 비교
- 회귀 테스트
- 재생성 자동화

---

## 6. Data Ownership

| Layer       | Owner            | 변경 가능 여부     |
| ----------- | ---------------- | ------------------ |
| Raw         | System           | ❌                 |
| Canonical   | System           | ❌ (재생성만 가능) |
| Explanation | AI / Rule Engine | ⭕                 |

---

## 7. Non-goals

이 아키텍처에서 **의도적으로 다루지 않는 것**:

- 실시간 공격 탐지
- 취약점 스캐너 기능
- 자동 패치 적용

---

## 8. Future Extensions

- Project Dependency 매핑 레이어
- Risk Scoring (조직 기준)
- 다국어 설명 레이어
- 사용자 피드백 기반 설명 개선

---

## 9. Summary

이 데이터 아키텍처는 다음을 보장한다:

- 원본 데이터의 신뢰성 유지
- 설명 로직의 독립성과 확장성
- 사용자 친화적 보안 정보 전달을 위한 기반 구조
