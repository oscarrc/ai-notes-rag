import {
  env,
  FeatureExtractionPipeline,
  pipeline,
  PipelineType,
  ProgressCallback,
} from '@huggingface/transformers';

env.allowRemoteModels = true;
env.remoteHost = '/api/models/embeddings';
env.remotePathTemplate = '{model}';

const task: PipelineType = 'feature-extraction';
let model: string = 'all-MiniLM-L6-v2';
let extractor: FeatureExtractionPipeline | null = null;

// Progress callback function
const progressCallback: ProgressCallback = (progress: any) => {
  self.postMessage({ status: 'init', progress });
};

// Function to initialize the pipeline instance
const getInstance = () => {
  return pipeline(task, model, {
    //@ts-ignore
    device: !!navigator.gpu ? "webgpu" : "wasm",
    progress_callback: progressCallback,
  }) as Promise<FeatureExtractionPipeline>;
};

self.addEventListener('message', async (event) => {
  const { type, model: newModel, text } = event.data;

  switch (type) {
    case 'init': {
      // Initialize with an optional model
      if (newModel) model = newModel;
      extractor = await getInstance();
      self.postMessage({ status: 'ready', model });
      break;
    }

    case 'model': {
      // Set new model and reinitialize
      if (!newModel) {
        self.postMessage({ status: 'error', message: 'Model name required' });
        return;
      }
      model = newModel;
      extractor = await getInstance();
      self.postMessage({ status: 'ready', model });
      break;
    }

    case 'run': {
      // Ensure instance is initialized
      if (!extractor) {
        extractor = await getInstance();
      }

      if (!extractor) {
        self.postMessage({ status: 'error', message: 'Failed to initialize model' });
        return;
      }

      // Perform inference
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert output to an array and post the result
      const embedding = Array.from(output.data);
      self.postMessage({ status: 'complete', embedding });
      break;
    }

    default:
      self.postMessage({ status: 'error', message: 'Invalid message type' });
  }
});
