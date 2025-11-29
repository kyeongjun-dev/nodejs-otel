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