/**
 * Unit Tests: Provider Map Module
 */

import { getProviderForModel } from '@/lib/openproviders/provider-map'

describe('lib/openproviders/provider-map', () => {
    describe('getProviderForModel', () => {
        describe('OpenAI models', () => {
            it('should return openai for GPT-4.1 models', () => {
                expect(getProviderForModel('gpt-4.1')).toBe('openai')
                expect(getProviderForModel('gpt-4.1-mini')).toBe('openai')
                expect(getProviderForModel('gpt-4.1-nano')).toBe('openai')
            })

            it('should return openai for GPT-4o models', () => {
                expect(getProviderForModel('gpt-4o')).toBe('openai')
                expect(getProviderForModel('gpt-4o-mini')).toBe('openai')
                expect(getProviderForModel('chatgpt-4o-latest')).toBe('openai')
            })

            it('should return openai for o1 models', () => {
                expect(getProviderForModel('o1')).toBe('openai')
                expect(getProviderForModel('o1-mini')).toBe('openai')
                expect(getProviderForModel('o1-preview')).toBe('openai')
            })

            it('should return openai for o3 models', () => {
                expect(getProviderForModel('o3-mini')).toBe('openai')
                expect(getProviderForModel('o3')).toBe('openai')
            })

            it('should return openai for GPT-4 turbo models', () => {
                expect(getProviderForModel('gpt-4-turbo')).toBe('openai')
                expect(getProviderForModel('gpt-4-turbo-preview')).toBe('openai')
            })

            it('should return openai for GPT-3.5 models', () => {
                expect(getProviderForModel('gpt-3.5-turbo')).toBe('openai')
                expect(getProviderForModel('gpt-3.5-turbo-0125')).toBe('openai')
            })
        })

        describe('Anthropic models', () => {
            it('should return anthropic for Claude 3.7 models', () => {
                expect(getProviderForModel('claude-3-7-sonnet-20250219')).toBe('anthropic')
            })

            it('should return anthropic for Claude 3.5 models', () => {
                expect(getProviderForModel('claude-3-5-sonnet-latest')).toBe('anthropic')
                expect(getProviderForModel('claude-3-5-haiku-latest')).toBe('anthropic')
            })

            it('should return anthropic for Claude 3 models', () => {
                expect(getProviderForModel('claude-3-opus-latest')).toBe('anthropic')
                expect(getProviderForModel('claude-3-sonnet-20240229')).toBe('anthropic')
                expect(getProviderForModel('claude-3-haiku-20240307')).toBe('anthropic')
            })
        })

        describe('Google models', () => {
            it('should return google for Gemini 2.0 models', () => {
                expect(getProviderForModel('gemini-2.0-flash-001')).toBe('google')
                expect(getProviderForModel('gemini-2.0-flash-exp')).toBe('google')
            })

            it('should return google for Gemini 1.5 models', () => {
                expect(getProviderForModel('gemini-1.5-flash')).toBe('google')
                expect(getProviderForModel('gemini-1.5-pro')).toBe('google')
                expect(getProviderForModel('gemini-1.5-flash-8b')).toBe('google')
            })

            it('should return google for Gemma models', () => {
                expect(getProviderForModel('gemma-3-27b-it')).toBe('google')
            })
        })

        describe('Mistral models', () => {
            it('should return mistral for Ministral models', () => {
                expect(getProviderForModel('ministral-3b-latest')).toBe('mistral')
                expect(getProviderForModel('ministral-8b-latest')).toBe('mistral')
            })

            it('should return mistral for Mistral models', () => {
                expect(getProviderForModel('mistral-large-latest')).toBe('mistral')
                expect(getProviderForModel('mistral-small-latest')).toBe('mistral')
            })

            it('should return mistral for Pixtral models', () => {
                expect(getProviderForModel('pixtral-large-latest')).toBe('mistral')
                expect(getProviderForModel('pixtral-12b-2409')).toBe('mistral')
            })

            it('should return mistral for open models', () => {
                expect(getProviderForModel('open-mistral-7b')).toBe('mistral')
                expect(getProviderForModel('open-mixtral-8x7b')).toBe('mistral')
            })
        })

        describe('Perplexity models', () => {
            it('should return perplexity for sonar models', () => {
                expect(getProviderForModel('sonar')).toBe('perplexity')
                expect(getProviderForModel('sonar-pro')).toBe('perplexity')
                expect(getProviderForModel('sonar-deep-research')).toBe('perplexity')
                expect(getProviderForModel('sonar-reasoning')).toBe('perplexity')
                expect(getProviderForModel('sonar-reasoning-pro')).toBe('perplexity')
            })
        })

        describe('XAI models', () => {
            it('should return xai for Grok 3 models', () => {
                expect(getProviderForModel('grok-3')).toBe('xai')
                expect(getProviderForModel('grok-3-fast')).toBe('xai')
                expect(getProviderForModel('grok-3-mini')).toBe('xai')
            })

            it('should return xai for Grok 2 models', () => {
                expect(getProviderForModel('grok-2')).toBe('xai')
                expect(getProviderForModel('grok-2-vision')).toBe('xai')
                expect(getProviderForModel('grok-2-image')).toBe('xai')
            })

            it('should return xai for Grok beta models', () => {
                expect(getProviderForModel('grok-beta')).toBe('xai')
                expect(getProviderForModel('grok-vision-beta')).toBe('xai')
            })
        })

        describe('OpenRouter models', () => {
            it('should return openrouter for openrouter: prefix', () => {
                expect(getProviderForModel('openrouter:anthropic/claude-3-opus')).toBe('openrouter')
                expect(getProviderForModel('openrouter:openai/gpt-4')).toBe('openrouter')
                expect(getProviderForModel('openrouter:meta-llama/llama-3-70b')).toBe('openrouter')
            })
        })

        describe('Ollama models', () => {
            it('should return ollama for static Ollama models', () => {
                expect(getProviderForModel('llama3.2:latest')).toBe('ollama')
                expect(getProviderForModel('qwen2.5-coder:latest')).toBe('ollama')
            })

            it('should return ollama for llama models', () => {
                expect(getProviderForModel('llama2')).toBe('ollama')
                expect(getProviderForModel('llama3')).toBe('ollama')
                expect(getProviderForModel('llama3.1:70b')).toBe('ollama')
            })

            it('should return ollama for qwen models', () => {
                expect(getProviderForModel('qwen2.5')).toBe('ollama')
                expect(getProviderForModel('qwen2.5:7b')).toBe('ollama')
            })

            it('should return ollama for deepseek models', () => {
                expect(getProviderForModel('deepseek-coder')).toBe('ollama')
                expect(getProviderForModel('deepseek-r1:7b')).toBe('ollama')
            })

            it('should return ollama for mistral: prefixed models', () => {
                expect(getProviderForModel('mistral:7b')).toBe('ollama')
                expect(getProviderForModel('mistral:latest')).toBe('ollama')
            })

            it('should return ollama for codellama models', () => {
                expect(getProviderForModel('codellama')).toBe('ollama')
                expect(getProviderForModel('codellama:13b')).toBe('ollama')
            })

            it('should return ollama for phi models', () => {
                expect(getProviderForModel('phi3')).toBe('ollama')
                expect(getProviderForModel('phi3:mini')).toBe('ollama')
            })

            it('should return ollama for gemma models (local)', () => {
                expect(getProviderForModel('gemma:7b')).toBe('ollama')
                expect(getProviderForModel('gemma2:latest')).toBe('ollama')
            })

            it('should return ollama for models with :latest tag', () => {
                expect(getProviderForModel('custom-model:latest')).toBe('ollama')
                expect(getProviderForModel('my-model:latest')).toBe('ollama')
            })

            it('should return ollama for models with version tags', () => {
                expect(getProviderForModel('custom-model:7b')).toBe('ollama')
                expect(getProviderForModel('my-model:13B')).toBe('ollama')
                expect(getProviderForModel('test-model:1.5')).toBe('ollama')
            })

            it('should return ollama for starcoder models', () => {
                expect(getProviderForModel('starcoder')).toBe('ollama')
                expect(getProviderForModel('starcoder2')).toBe('ollama')
            })

            it('should return ollama for wizardcoder models', () => {
                expect(getProviderForModel('wizardcoder')).toBe('ollama')
            })

            it('should return ollama for solar models', () => {
                expect(getProviderForModel('solar')).toBe('ollama')
            })

            it('should return ollama for yi models', () => {
                expect(getProviderForModel('yi:34b')).toBe('ollama')
            })

            it('should return ollama for openchat models', () => {
                expect(getProviderForModel('openchat')).toBe('ollama')
            })

            it('should return ollama for vicuna models', () => {
                expect(getProviderForModel('vicuna')).toBe('ollama')
            })

            it('should return ollama for orca models', () => {
                expect(getProviderForModel('orca')).toBe('ollama')
            })
        })

        describe('Error handling', () => {
            it('should throw error for unknown model', () => {
                expect(() => {
                    getProviderForModel('unknown-model-xyz' as any)
                }).toThrow('Unknown provider for model')
            })

            it('should throw error for empty string', () => {
                expect(() => {
                    getProviderForModel('' as any)
                }).toThrow('Unknown provider for model')
            })

            it('should throw error for invalid model format', () => {
                expect(() => {
                    getProviderForModel('not-a-real-model' as any)
                }).toThrow('Unknown provider for model')
            })
        })

        describe('Case sensitivity', () => {
            it('should handle case-insensitive Ollama patterns', () => {
                expect(getProviderForModel('LLAMA3')).toBe('ollama')
                expect(getProviderForModel('Qwen2.5')).toBe('ollama')
                expect(getProviderForModel('DeepSeek')).toBe('ollama')
            })
        })
    })
})
