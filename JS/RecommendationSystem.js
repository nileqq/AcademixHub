class RecommendationSystem {
    constructor(graphManager) {
        this.graphManager = graphManager;
    }

    getRecommendationsForEvent(eventId) {
        const event = this.graphManager.getEventById(eventId);
        if (!event) return [];

        const allEvents = this.graphManager.getAllEvents().filter(e => !e.isCenter);
        const similarEvents = this.findSimilarEvents(event, allEvents);
        const complementaryEvents = this.findComplementaryEvents(event, allEvents);
        const nextSteps = this.suggestNextSteps(event, allEvents);

        return {
            similar: similarEvents,
            complementary: complementaryEvents,
            nextSteps: nextSteps,
            insights: this.generateInsight(event)
        };
    }

    getGlobalRecommendations() {
        const allEvents = this.graphManager.getAllEvents().filter(e => !e.isCenter);
        const trendingTags = this.getTrendingTags(allEvents);
        const commonMistakes = this.getCommonMistakes(allEvents);

        return {
            trendingTags,
            commonMistakes,
            topEvents: allEvents
                .sort((a, b) => this.calculateEventScore(b) - this.calculateEventScore(a))
                .slice(0, 5)
        };
    }

    calculateEventScore(event) {
        let score = 0;
        score += event.tags.length * 10;
        score += event.participants * 2;
        score += Math.min(event.budget / 10000, 20);
        if (event.errors.length === 0) score += 15;
        return score;
    }

    findSimilarEvents(targetEvent, allEvents, count = 5) {
        const similarities = allEvents
            .filter(e => e.id !== targetEvent.id)
            .map(event => ({
                event,
                similarity: targetEvent.calculateSimilarity(event)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, count);

        return similarities;
    }

    findComplementaryEvents(targetEvent, allEvents, count = 3) {
        const complementary = allEvents
            .filter(e => e.id !== targetEvent.id)
            .filter(event => {
                const hasNoCommonTags = !hasCommon(targetEvent.tags, event.tags);
                const hasSimilarBudget = Math.abs(targetEvent.budget - event.budget) < targetEvent.budget * 0.5;
                return hasNoCommonTags && hasSimilarBudget;
            })
            .map(event => ({
                event,
                reason: 'Может дополнить вашу карту новыми направлениями'
            }))
            .slice(0, count);

        return complementary;
    }

    suggestNextSteps(targetEvent, allEvents) {
        const suggestions = [];

        if (targetEvent.errors.length > 0) {
            suggestions.push({
                type: 'improvement',
                title: 'Работа над ошибками',
                description: `Рекомендуем проработать: ${targetEvent.errors.slice(0, 2).join(', ')}`
            });
        }

        if (targetEvent.tags.length < 2) {
            suggestions.push({
                type: 'expansion',
                title: 'Расширение тематики',
                description: 'Добавьте больше ключевых решений для лучшего анализа'
            });
        }

        if (targetEvent.participants < 5) {
            suggestions.push({
                type: 'growth',
                title: 'Увеличение масштаба',
                description: 'Рассмотрите способы привлечения большего количества участников'
            });
        }

        return suggestions;
    }

    generateInsight(event) {
        const insights = [];

        if (event.errors.length === 0) {
            insights.push('✅ Отличная работа! У этого мероприятия нет ошибок.');
        } else {
            insights.push(`⚠️ Обнаружено ${event.errors.length} области для улучшения.`);
        }

        if (event.participants > 50) {
            insights.push('👥 Крупное мероприятие с большим количеством участников.');
        }

        if (event.budget > 100000) {
            insights.push('💰 Высокобюджетное мероприятие - хороший потенциал.');
        }

        return insights.join(' ');
    }

    getTrendingTags(allEvents) {
        const tagCounts = {};
        
        allEvents.forEach(event => {
            event.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));
    }

    getCommonMistakes(allEvents) {
        const errorCounts = {};
        
        allEvents.forEach(event => {
            event.errors.forEach(error => {
                errorCounts[error] = (errorCounts[error] || 0) + 1;
            });
        });

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([error, count]) => ({ error, count }));
    }
}

window.RecommendationSystem = RecommendationSystem;
