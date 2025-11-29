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

패키지 설치
```
npm install @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/sdk-trace-node
  @opentelemetry/api
  lightningcss
```

`instrumentation.js` 파일을 `my-app-docker/`에 생성 - 실행환경이 nodejs인 경우에만 instrument 진행
```
// instrumentation.js
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
```

`instrumentation.node.ts` 파일을 `my-app-docker/`에 생성 -
```
// instrumentation.node.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

// trace to log - start
import { trace, context } from '@opentelemetry/api'; // [1] API 임포트

// [2] console 메서드를 오버라이딩하는 로직 추가
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

CONSOLE_METHODS.forEach((methodName) => {
  const originalMethod = console[methodName];

  console[methodName] = (...args: any[]) => {
    // 현재 활성 스팬에서 traceId 가져오기
    const span = trace.getSpan(context.active());
    if (span) {
      const { traceId } = span.spanContext();
      // 기존 로그 메시지 앞에 traceId 추가
      originalMethod.apply(console, [`trace_id=${traceId}`, ...args]);
    } else {
      // 활성 스팬이 없으면 원래대로 출력
      originalMethod.apply(console, args);
    }
  };
});
// trace to log - end

const sdk = new NodeSDK({
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
  // spanProcessors: [new BatchSpanProcessor(new ConsoleSpanExporter())],
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': {
        enabled: false,
    },
    '@opentelemetry/instrumentation-net': {
        enabled: false,
    },
    '@opentelemetry/instrumentation-dns': {
        enabled: false,
    },
    '@opentelemetry/instrumentation-http': {
        enabled: true,
    },
  })]
})
sdk.start()
```

`Dockerfile`을 `my-app-docker/`에 작성
```
FROM node:22.19.0-slim
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
```

`docker-compose`를 이용해 실행
```
docker-compose up -d
```