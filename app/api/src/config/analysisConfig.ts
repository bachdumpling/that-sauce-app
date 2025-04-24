// src/config/analysisConfig.ts
export const ANALYSIS_CONFIG = {
  // Rate limiting settings
  RATE_LIMITS: {
    IMAGE_REQUESTS_PER_MINUTE: 10,
    TEXT_REQUESTS_PER_MINUTE: 20,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000,
  },

  // Time limits for reanalysis
  TIME_LIMITS: {
    MIN_HOURS_BETWEEN_ANALYSES: 0,
    MAX_ANALYSES_PER_MONTH: 100,
  },

  // Prompts used for analysis
  PROMPTS: {
    IMAGE_ANALYSIS: `As a professional creative curator, provide a detailed analysis of this image focusing on:
  
      1. Technical Aspects:
         - Composition and framing
         - Lighting techniques used
         - Color palette and treatment
         - Technical quality and execution
         - Typography and text elements
  
      2. Creative Elements:
         - Main subject and focal points
         - Style and artistic approach
         - Mood and atmosphere
         - Visual storytelling elements
         - Quality of the message on the image
  
      3. Professional Context:
         - Apparent purpose or commercial application
         - Target audience or market segment
         - Production value indicators
         - Industry-specific elements
         - The quality of the copy and the image work together`,

    PROJECT_ANALYSIS: `As a professional creative director, analyze this creative project focusing on:
  
      1. Overall concept and creative direction
      - Visual style and aesthetic approach
      - Technical execution and production quality
      - Target audience and commercial potential
      - Industry relevance and application
      - Creative innovation and unique elements
  
      2. Technical proficiency
      - Visual consistency and brand alignment
      - Production standards and execution quality
      - Technical tools and methodologies used
      - Quality control and professional finish
  
      3. Market positioning
      - Target audience understanding
      - Commercial viability and applications
      - Industry alignment and relevance
      - Unique value proposition`,

    PORTFOLIO_ANALYSIS: `As a creative director, analyze this creator's body of work across multiple projects.
    First, List the titles of the projects in the portfolio.
    Then, Focus on:
      1. Professional Identity and Market Position:
         - Target industries and market segments
         - Client types and commercial focus
         - Professional specializations
  
      2. Creative and Technical Expertise:
         - Signature style and distinctive elements
         - Technical proficiency and specialties
         - Production value and quality standards
  
      3. Portfolio Strategy:
         - Project diversity and specialization balance
         - Industry alignment and market relevance
         - Portfolio cohesion and professional narrative
  
      4. Commercial Viability:
         - Target audience understanding
         - Industry trend alignment
         - Unique value proposition`,

    // Add to ANALYSIS_CONFIG.PROMPTS
    VIDEO_CONTENT_ANALYSIS: `
As a professional video content analyst, provide a detailed technical and creative analysis of this video focusing on:
Technical Aspects:
- Cinematography (shot composition, camera movement, framing choices)
- Lighting design and execution (exposure, contrast, practical vs. artificial)
- Color grading and visual treatment
- Audio quality (sound design, mixing, music integration)
- Edit pacing and post-production elements
- Technical execution quality across all production elements

Creative Elements:
- Visual narrative structure and storytelling approach
- Movement and timing choices
- Mood development and atmosphere building
- Performance and subject presentation
- Scene transitions and story progression
- Creative innovation and unique techniques

Professional Context:
- Production value indicators and industry standards alignment
- Target audience considerations and engagement approach
- Platform optimization and delivery format
- Commercial or artistic intent markers
- Professional execution benchmarks
- Industry-specific technical requirements

Keep the analysis objective and focused on observable elements. Use professional terminology while maintaining clarity. Describe the video's characteristics through a technical and creative lens without making assumptions about creator intent. Format as a continuous, detailed paragraph without headers or sections. Focus on how different elements work together to create the overall viewing experience.`,
  },
};
