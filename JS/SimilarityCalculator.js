// # ---- Калькулятор схожести мероприятий ---- #

class SimilarityCalculator {
    /**
     * Рассчитывает схожесть между всеми парами мероприятий
     */
    static calculateAllSimilarities(events) {
        const similarities = [];
        
        // Фильтруем центральную вершину
        const regularEvents = events.filter(event => !event.isCenter);
        
        for (let i = 0; i < regularEvents.length; i++) {
            for (let j = i + 1; j < regularEvents.length; j++) {
                const similarity = regularEvents[i].calculateSimilarity(regularEvents[j]);
                similarities.push({
                    event1: regularEvents[i],
                    event2: regularEvents[j],
                    similarity: similarity,
                    type: this.getConnectionType(regularEvents[i], regularEvents[j])
                });
            }
        }
        
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Получает рекомендации для конкретного мероприятия
     */
    static getRecommendations(targetEvent, allEvents, limit = null) {
        const otherEvents = allEvents.filter(event => 
            event.id !== targetEvent.id && !event.isCenter
        );
        
        const recommendations = otherEvents.map(event => {
            const similarity = targetEvent.calculateSimilarity(event);
            return {
                event: event,
                similarity: similarity,
                details: {
                    tagSimilarity: targetEvent.calculateTagSimilarity(event),
                    budgetSimilarity: targetEvent.calculateBudgetSimilarity(event),
                    dateSimilarity: targetEvent.calculateDateSimilarity(event),
                    participantsSimilarity: targetEvent.calculateParticipantsSimilarity(event)
                }
            };
        });
        
        const sorted = recommendations.sort((a, b) => b.similarity - a.similarity);
        
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Определяет тип связи между мероприятиями
     */
    static getConnectionType(event1, event2) {
        if (hasCommon(event1.tags, event2.tags)) {
            return 'tag';
        } else if (hasCommon(event1.errors, event2.errors)) {
            return 'error';
        }
        return null;
    }

    /**
     * Рассчитывает схожесть с центральной вершиной
     */
    static calculateSimilarityToCenter(event) {
        // Виртуальная центральная вершина с идеальными параметрами
        const centerVirtualEvent = {
            tags: ['#развитие', '#направление', '#потенциал'],
            budget: 0,
            date: new Date().toISOString().split('T')[0],
            participants: 1,
            calculateTagSimilarity: function(other) {
                const commonTags = this.tags.filter(tag => other.tags.includes(tag)).length;
                const totalTags = new Set([...this.tags, ...other.tags]).size;
                return totalTags === 0 ? 1 : (commonTags / totalTags) * 2;
            },
            calculateBudgetSimilarity: function(other) {
                return calculateSimilarityValue(this.budget, other.budget);
            },
            calculateDateSimilarity: function(other) {
                return calculateDateSimilarity(this.date, other.date);
            },
            calculateParticipantsSimilarity: function(other) {
                return calculateSimilarityValue(this.participants, other.participants);
            }
        };
        
        return event.calculateSimilarity(centerVirtualEvent);
    }

    /**
     * Получает рекомендации для развития от центральной вершины
     */
    static getDevelopmentRecommendations(allEvents, limit = 5) {
        const regularEvents = allEvents.filter(event => !event.isCenter);
        
        const recommendations = regularEvents.map(event => {
            const similarity = this.calculateSimilarityToCenter(event);
            const developmentPotential = Math.min(100, similarity * 100);
            
            return {
                event: event,
                similarity: similarity,
                developmentPotential: developmentPotential,
                direction: this.getDevelopmentDirection(event)
            };
        })
        .sort((a, b) => b.developmentPotential - a.developmentPotential)
        .slice(0, limit);
        
        return recommendations;
    }

    /**
     * Определяет направление развития на основе тегов
     */
    static getDevelopmentDirection(event) {
        const tagDirections = {
            '#хакатон': 'Технические навыки',
            '#митап': 'Сетевое взаимодействие',
            '#конференция': 'Профессиональный рост',
            '#воркшоп': 'Практические навыки',
            '#лекция': 'Теоретические знания',
            '#марафон': 'Выносливость и упорство',
            '#соревнование': 'Конкурентные навыки',
            '#выставка': 'Творческий подход',
            '#тренинг': 'Личностный рост',
            '#хаттон': 'Решение задач',
            '#ивент': 'Организация событий'
        };
        
        for (const tag of event.tags) {
            if (tagDirections[tag.toLowerCase()]) {
                return tagDirections[tag.toLowerCase()];
            }
        }
        
        return 'Общее развитие';
    }

    /**
     * Рассчитывает среднюю схожесть в группе
     */
    static calculateGroupSimilarity(group) {
        if (group.length < 2) return 2;
        
        let totalSimilarity = 0;
        let pairCount = 0;
        
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                totalSimilarity += group[i].calculateSimilarity(group[j]);
                pairCount++;
            }
        }
        
        return totalSimilarity / pairCount;
    }
}