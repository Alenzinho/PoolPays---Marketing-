import { VectorDocument, AgentRole, AgentLog, ChatMessage } from "../types";
import { vectorStore } from "./vectorStore";
import { generateText, FAST_MODEL, SMART_MODEL } from "./gemini";

const PERSONAS: Record<AgentRole, string> = {
  SUPERVISOR: `You are the PoolPays Intelligence Supervisor - A Meta-Cognitive Router.

MISSION: Analyze user intent and delegate to the optimal specialist.

DELEGATION MATRIX:
- GUARDIAN → Brand questions (manifesto, tone, narrative, positioning)
- GROWTH → Marketing questions (content, copy, ads, funnels, campaigns)
- ARCHITECT → Tech questions (contracts, math, security, documentation)

OUTPUT FORMAT: Single word agent name only: "GUARDIAN", "GROWTH", or "ARCHITECT"`,

  GUARDIAN: `You are the GUARDIAN - Chief Brand Officer of PoolPays.

IDENTITY: "The House Always Wins" - But here, YOU are the house.

TONE MANIFESTO:
✓ Sovereign, confident, anti-establishment
✓ Code over promises, math over marketing
✓ "Trustless by design, permissionless by default"

✗ NEVER USE: Corporate jargon, "easy money", lottery language
✗ NEVER PROMISE: Guaranteed returns, get-rich-quick schemes

OUTPUT STRUCTURE:
1. Hook (contrarian statement)
2. Context (what others do wrong)
3. Truth (PoolPays way)
4. Call to sovereignty (not action)`,

  GROWTH: `You are GROWTH - Head of Acquisition & Content Strategy.

MISSION: Drive liquidity inflow through high-converting content.

METHODOLOGY: AIDA Framework
- Attention: Pattern interrupt
- Interest: Curiosity gaps + contrarian takes
- Desire: Math > emotion (show yield, not promises)
- Action: Frictionless CTAs

CONTENT TYPES:
1. Reels/Shorts (30s max)
   - Hook: First 3 seconds = everything
   - Format: Problem-Agitate-Solve

2. Threads/Carousels
   - Structure: 1 Bold Claim → 5 Proof Points → 1 CTA

3. Ads (Meta/X)
   - Formula: [Pain] + [Unique Mechanism] + [Proof] + [CTA]

OUTPUT FORMAT:
[STRATEGY] Brief explanation
[COPY] Actual content ready to use
[HOOKS] 3 alternative opening lines
[CTA] Direct next step`,

  ARCHITECT: `You are ARCHITECT - Lead Technical Documentation Specialist.

MISSION: Provide zero-hallucination technical truth.

PRINCIPLES:
1. Precision > Simplification
2. Math > Narratives (show formulas)
3. On-Chain Verification (link contracts)

RESPONSE FRAMEWORK:
1. Technical Answer (the what)
2. Mathematical Proof (the how)
3. On-Chain Reference (the where)
4. Risk Disclosure (the caveats)

STRICT RULES:
- If data not in context → "Information not found in documentation"
- Never invent numbers
- Never oversimplify security

OUTPUT FORMAT:
[ANSWER] Direct technical response
[PROOF] Mathematical or code evidence
[SOURCE] Link or contract address
[CAVEAT] What could go wrong`
};

const AGENT_MEMORY_ACCESS: Record<AgentRole, string[]> = {
  SUPERVISOR: [],
  GUARDIAN: ['CORE_IDENTITY'],
  GROWTH: ['MARKETING_OPS', 'CORE_IDENTITY'],
  ARCHITECT: ['TECH_DOCS', 'CORE_IDENTITY']
};

export const runMultiAgentSystem = async (
  query: string,
  forcedAgent?: AgentRole | null,
  conversationHistory?: ChatMessage[], // 🆕 HISTÓRICO
  onProgress?: (stage: string, agent: AgentRole) => void // 🆕 CALLBACK
): Promise<{ text: string; agent: AgentRole; context: VectorDocument[]; logs: AgentLog[] }> => {
  const logs: AgentLog[] = [];
  const startTime = Date.now();
  
  // STEP 1: AGENT SELECTION
  let selectedAgent: AgentRole = 'GUARDIAN';

  if (forcedAgent && forcedAgent !== 'SUPERVISOR') {
    selectedAgent = forcedAgent;
    logs.push({ 
      step: 'MANUAL_OVERRIDE', 
      details: `Operator forced control to: ${selectedAgent}`, 
      agent: 'SUPERVISOR', 
      timestamp: Date.now() 
    });
    onProgress?.('Manual override active', 'SUPERVISOR');
  } else {
    onProgress?.('Analyzing intent...', 'SUPERVISOR');
    logs.push({ 
      step: 'INTENT_ANALYSIS', 
      details: 'Supervisor analyzing query intent...', 
      agent: 'SUPERVISOR', 
      timestamp: Date.now() 
    });
    
    try {
      const intentPrompt = `Query: "${query}". Who handles this? GUARDIAN (Brand), GROWTH (Marketing), ARCHITECT (Tech). Reply ONE word.`;
      const intentText = (await generateText(FAST_MODEL, intentPrompt)).trim().toUpperCase();
      
      if (intentText.includes('GROWTH')) selectedAgent = 'GROWTH';
      else if (intentText.includes('ARCHITECT')) selectedAgent = 'ARCHITECT';
      else selectedAgent = 'GUARDIAN';
      
      logs.push({ 
        step: 'DELEGATION', 
        details: `Intent detected. Delegating to: ${selectedAgent}`, 
        agent: 'SUPERVISOR', 
        timestamp: Date.now() 
      });
      onProgress?.(`Delegated to ${selectedAgent}`, 'SUPERVISOR');

    } catch (e) {
      console.warn("Supervisor Fallback", e);
      logs.push({ step: 'ERROR', details: 'Supervisor unreachable. Defaulting to Guardian.', agent: 'SUPERVISOR', timestamp: Date.now() });
    }
  }

  // STEP 2: CONTEXT RETRIEVAL
  const allowedCategories = AGENT_MEMORY_ACCESS[selectedAgent];
  
  onProgress?.(`${selectedAgent} searching memory...`, selectedAgent);
  logs.push({ 
    step: 'MEMORY_ACCESS', 
    details: `Agent ${selectedAgent} querying Neural Folders: ${allowedCategories.length > 0 ? allowedCategories.join(', ') : 'GLOBAL'}...`, 
    agent: selectedAgent, 
    timestamp: Date.now() 
  });

  const relevantDocs = await vectorStore.search(query, 5, allowedCategories);
  
  if (relevantDocs.length > 0) {
     logs.push({ 
        step: 'CITATION', 
        details: `Found ${relevantDocs.length} references: ${relevantDocs.map(d => d.metadata.title).join(', ')}`, 
        agent: selectedAgent, 
        timestamp: Date.now() 
      });
  } else {
     logs.push({ step: 'MEMORY_MISS', details: `No relevant documents found in folders: ${allowedCategories.join(', ')}`, agent: selectedAgent, timestamp: Date.now() });
  }

  // STEP 3: SPECIALIST GENERATION (COM HISTÓRICO)
  onProgress?.(`${selectedAgent} generating response...`, selectedAgent);
  
  const contextText = relevantDocs
    .map(d => `[SOURCE: ${d.metadata.category || 'GENERAL'} - ${d.metadata.title}]\n${d.content}`)
    .join('\n\n');

  // 🆕 FORMATAR HISTÓRICO
  const historyText = conversationHistory && conversationHistory.length > 0
    ? conversationHistory
        .slice(-6) // Últimas 3 trocas
        .map(msg => `${msg.role === 'user' ? 'USER' : `ASSISTANT (${msg.agent || 'SYSTEM'})`}: ${msg.content}`)
        .join('\n\n')
    : 'No previous context.';
  
  const systemPrompt = PERSONAS[selectedAgent];
  
  const finalPrompt = `
    ${systemPrompt}

    CONVERSATION HISTORY (Last 3 exchanges):
    ${historyText}

    CONTEXT FROM NEURAL DATABASE (${allowedCategories.join(', ')}):
    ${contextText}

    CURRENT USER COMMAND:
    "${query}"

    INSTRUCTIONS:
    - Consider the conversation history for continuity
    - Answer strictly based on the Context provided
    - Maintain your Persona perfectly
    - If context is missing, state clearly "Information not found in Knowledge Base"
  `;

  const responseText = await generateText(SMART_MODEL, finalPrompt);

  logs.push({ 
    step: 'EXECUTION_COMPLETE', 
    details: `Response generated in ${Date.now() - startTime}ms`, 
    agent: selectedAgent, 
    timestamp: Date.now() 
  });

  onProgress?.('Complete', selectedAgent);

  return {
    text: responseText || "Agent malfunction.",
    agent: selectedAgent,
    context: relevantDocs,
    logs: logs
  };
};