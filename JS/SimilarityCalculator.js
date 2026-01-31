class SimilarityCalculator {
    static calculateSimilarityToCenter(event) {
        const centerEvent = window.graphManager?.getCenterVertex?.() || 
                           window.graphManager?.getAllEvents?.().find(e => e.isCenter);
        
        if (!centerEvent || !event) return 1;
        return event.calculateSimilarity(centerEvent);
    }

    static calculateAllSimilarities(events) {
        const similarities = [];
        
        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const event1 = events[i];
                const event2 = events[j];
                
                // Пропускаем центральную вершину в общих сравнениях
                if (event1.isCenter || event2.isCenter) continue;
                
                const similarity = event1.calculateSimilarity(event2);
                
                similarities.push({
                    event1,
                    event2,
                    similarity
                });
            }
        }
        
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    static getRecommendations(selectedEvent, allEvents, count = 5) {
        if (!selectedEvent) return [];
        
        const recommendations = [];
        
        allEvents.forEach(event => {
            if (event.id === selectedEvent.id || event.isCenter) return;
            
            const similarity = selectedEvent.calculateSimilarity(event);
            
            recommendations.push({
                event,
                similarity,
                details: {
                    tagSimilarity: selectedEvent.calculateTagSimilarity(event),
                    budgetSimilarity: selectedEvent.calculateBudgetSimilarity(event),
                    dateSimilarity: selectedEvent.calculateDateSimilarity(event),
                    participantsSimilarity: selectedEvent.calculateParticipantsSimilarity(event)
                }
            });
        });
        
        return recommendations
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, count);
    }

    static getDevelopmentRecommendations(allEvents) {
        const centerEvent = allEvents.find(e => e.isCenter);
        if (!centerEvent) return [];
        
        const recommendations = [];
        
        allEvents.forEach(event => {
            if (event.isCenter) return;
            
            const similarityToCenter = event.calculateSimilarity(centerEvent);
            const developmentPotential = (2 - similarityToCenter) * 50;
            
            let direction = 'Общее развитие';
            if (event.tags.length > 0) {
                direction = event.tags[0].replace('#', '').replace('_', ' ');
            }
            
            recommendations.push({
                event,
                similarityToCenter,
                developmentPotential,
                direction
            });
        });
        
        return recommendations
            .sort((a, b) => b.developmentPotential - a.developmentPotential)
            .slice(0, 5);
    }
}

window.SimilarityCalculator = SimilarityCalculator;
