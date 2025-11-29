# nodejs-otel

## 데모 앱으로 테스트

데모 앱 생성

```
npx create-next-app@latest my-app --yes
cd my-app
```

패키지 설치

```
npm install @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/sdk-trace-node
```

`instrumentation.ts` 파일을 `my-app/` 에 생성

```
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

서버 실행

```
npm run dev
```

`localhost:3000` 접속 후, 터미널(콘솔)에 출력되는 trace 확인

## tempo, grafana로 시각화하기

별도 디렉토리로 데모 앱 생성

```
npx create-next-app@latest my-app-docker --yes
cd my-app-docker
```

패키지 설치 (설치한 패키지 기록용으로, 실행하지 않고, 다음 단계인 docker-compose만 진행해도 됨)

```
npm install @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/sdk-trace-node
  @opentelemetry/api
  lightningcss
```

`docker-compose`를 이용해 실행

```
docker-compose up -d
```
