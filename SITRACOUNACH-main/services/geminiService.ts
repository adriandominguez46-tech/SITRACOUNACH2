
import { GoogleGenAI } from "@google/genai";
import { UserProfile, KnowledgeBaseItem } from "../types";
import { fetchAIKnowledgeBase } from "./airtableService";

export const getLaborAdvice = async (profile: UserProfile, question: string) => {
  try {
    // Inicialización interna para evitar crash en el arranque del navegador
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    // Obtener conocimiento entrenado del sindicato
    const knowledgeBase = await fetchAIKnowledgeBase();
    const activeKnowledge = knowledgeBase.filter(k => k.activo);
    
    // Crear un string de contexto oficial
    const officialContext = activeKnowledge.map(k => 
      `DOCUMENTO [${k.categoria}]: ${k.titulo}\nREFERENCIA: ${k.referencia}\nCONTENIDO: ${k.contenido}`
    ).join('\n\n---\n\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Contexto Oficial del Sindicato SITRACOUNACH:\n${officialContext}\n\nPregunta del usuario: ${question}`,
      config: {
        systemInstruction: `Eres un experto en leyes laborales y gestión sindical para el "Sindicato de Trabajadores de Confianza de la Universidad Autónoma de Chiapas" (SITRACOUNACH). 
        
        INSTRUCCIONES CRÍTICAS:
        1. Tu fuente principal de verdad es el "Contexto Oficial del Sindicato" proporcionado arriba. Úsalo para dar respuestas precisas.
        2. Menciona siempre números de oficio, cláusulas del CCT o estatutos que aparezcan en el contexto oficial.
        3. El afiliado que consulta es:
           - Nombre: ${profile.fullName}
           - Estatus Laboral: ${profile.status}
           - Rol Sindical: ${profile.role}
           - Área Universitaria: ${profile.area}
        
        Responde de forma profesional, firme en la defensa de los derechos, y legalmente orientada. Utiliza un tono de apoyo y solidaridad sindical. Menciona que eres el Asesor Inteligente Oficial del SITRACOUNACH.`,
        temperature: 0.3,
        topP: 0.9,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching labor advice:", error);
    return "Lo siento, hubo un problema al procesar tu consulta legal. Por favor verifica que la API_KEY de Gemini esté configurada correctamente o contacta al administrador.";
  }
};

export const analyzeLaborStatus = async (profile: UserProfile) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza brevemente la situación laboral de este afiliado del SITRACOUNACH (Sindicato UNACH) y da 3 recomendaciones estratégicas específicas para su rol de ${profile.role} en el contexto universitario. Perfil: ${JSON.stringify(profile)}`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    return "No se pudo realizar el análisis automático en este momento.";
  }
};
