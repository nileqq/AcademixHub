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
        // score: насколько запись “сильная” для портфолио
        let score = 0;

        // заполненность
        if (event.description && event.description.trim().length > 0) score += 15;
        if (event.result && event.result.trim().length > 0) score += 15;
        if (event.reflection && event.reflection.trim().length > 0) score += 15;
        if (event.date) score += 10;
        if (event.portfolioType) score += 10;

        // теги / навыки
        score += Math.min(event.tags.length * 8, 40);

        // качество (ошибки — опционально, но если их нет — плюс)
        if ((event.errors?.length || 0) === 0) score += 10;

        // свежесть (если есть дата)
        if (event.date) {
            const days = Math.abs((Date.now() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24));
            // чем ближе к сегодня, тем чуть больше
            score += Math.max(0, 10 - Math.min(10, days / 30));
        }

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
        // “Комплементарные” = другой тип + дают новые навыки
        const targetTags = new Set(targetEvent.tags);

        const complementary = allEvents
            .filter(e => e.id !== targetEvent.id)
            .map(event => {
                const newTags = event.tags.filter(t => !targetTags.has(t));
                const typeBonus = (event.portfolioType && targetEvent.portfolioType && event.portfolioType !== targetEvent.portfolioType) ? 1 : 0;

                const score = newTags.length + typeBonus * 2;

                return {
                    event,
                    score,
                    reason: newTags.length > 0
                        ? `Добавляет новые навыки: ${newTags.slice(0, 3).join(', ')}`
                        : 'Дополняет портфолио другим типом активности'
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(({ event, reason }) => ({ event, reason }));

        return complementary;
    }

    suggestNextSteps(targetEvent, allEvents) {
        const suggestions = [];

        // если есть ошибки — подсказка
        if ((targetEvent.errors?.length || 0) > 0) {
            suggestions.push({
                type: 'improvement',
                title: 'Проработка слабых мест',
                description: `Обрати внимание на: ${targetEvent.errors.slice(0, 2).join(', ')}`
            });
        }

        // если мало тегов — попросить добавить навыки
        if ((targetEvent.tags?.length || 0) < 2) {
            suggestions.push({
                type: 'expansion',
                title: 'Добавь навыки',
                description: 'Добавь 2–4 тега навыков, чтобы система лучше рекомендовала развитие'
            });
        }

        // если нет рефлексии/результата/описания — подсказка
        if (!targetEvent.description || targetEvent.description.trim().length === 0) {
            suggestions.push({
                type: 'completeness',
                title: 'Добавь описание',
                description: 'Коротко опиши, что именно ты сделал(а) (1–2 предложения)'
            });
        }
        if (!targetEvent.result || targetEvent.result.trim().length === 0) {
            suggestions.push({
                type: 'completeness',
                title: 'Зафиксируй результат',
                description: 'Укажи итог: место, сертификат, достигнутая цель'
            });
        }
        if (!targetEvent.reflection || targetEvent.reflection.trim().length === 0) {
            suggestions.push({
                type: 'completeness',
                title: 'Добавь рефлексию',
                description: 'Напиши, чему научился(ась) или что улучшил(а)'
            });
        }

        // “следующий шаг” — предложить запись другого типа
        const hasOtherType = allEvents.some(e => !e.isCenter && e.portfolioType && e.portfolioType !== targetEvent.portfolioType);
        if (!hasOtherType) {
            suggestions.push({
                type: 'balance',
                title: 'Сбалансируй портфолио',
                description: 'Добавь запись другого типа (например, олимпиада/волонтёрство/курс)'
            });
        }

        return suggestions;
    }

    generateInsight(event) {
        const insights = [];

        const filled = [
            !!event.description, !!event.result, !!event.reflection, !!event.date
        ].filter(Boolean).length;

        insights.push(`🧩 Заполненность: ${filled}/4`);

        if ((event.errors?.length || 0) === 0) insights.push('✅ Без ошибок/замечаний.');
        else insights.push(`⚠️ Есть улучшения: ${event.errors.length}`);

        if ((event.tags?.length || 0) >= 4) insights.push('🏷️ Хорошая детализация навыков.');
        if (event.portfolioType) insights.push(`📌 Тип: ${event.portfolioType}`);

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
