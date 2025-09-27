import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const AboutUs = () => {
  return (
    <ScrollView style={styles.container}>
        <View style={styles.introContainer}>
            <Text style={styles.title}>С помощью приложения вы можете:</Text>
        </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.bulletPoint} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Оформить подписку на кофе</Text>
            <Text style={styles.featureDescription}>
              Получайте напитки по специальной цене в рамках действующего тарифа.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.bulletPoint} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Сделать предзаказ</Text>
            <Text style={styles.featureDescription}>
              Заказывайте заранее и забирайте без ожидания.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.bulletPoint} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Оплатить онлайн</Text>
            <Text style={styles.featureDescription}>
              Безопасная и быстрая оплата через встроенный сервис.
            </Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.bulletPoint} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Просматривать актуальное меню</Text>
            <Text style={styles.featureDescription}>
              Всегда в курсе ассортимента и новинок.
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.closingContainer}>
        <Text style={styles.closingText}>
          Мы стремимся сделать ваше посещение кофейни максимально комфортным и быстрым.
        </Text>
        <Text style={styles.thankYouText}>
          Спасибо, что выбираете нас!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1D1D1D',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'left',
  },
  introContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  introText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#375E2A',
    marginTop: 6,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  closingContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  closingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 12,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A984FF',
    textAlign: 'left',
  },
});

export default AboutUs;