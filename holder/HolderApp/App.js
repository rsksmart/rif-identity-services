/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import { agent } from './setup'

const App: () => React$Node = () => {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState('')

  const catchError = error => { console.error(error); setError(error.message); return error }

  useEffect(() => {
    agent.identityManager.getIdentities()
      .then(identities => {
        console.log(identities)
        if (identities.length) setIdentity(identities[0].did)
      }).catch(catchError)
  }, [])

  const createIdentity = () => agent.identityManager.identityProviders[0].createIdentity()
    .then(({ did }) => setIdentity(did))
    .catch(catchError)

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Holder app</Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Create your identity!
              </Text>
              {
                identity
                  ? <Text style={styles.sectionDescription}>Identity: {identity}</Text>
                  : <Button title="Create identity" onPress={createIdentity} />
              }
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                First request a credential
              </Text>
              <Button title="Request credential"></Button>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Get the requested credential
              </Text>
              <Button title="Get credential"></Button>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Now verify the credential
              </Text>
              <Button title="Verify"></Button>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Finally, store it in the Data vault
              </Text>
              <Button title="Backup"></Button>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Try out the data vault recovery
              </Text>
              <Button title="Recover"></Button>
            </View>
          </View>
          {!!error &&
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionDescription}>Error:</Text>
                <Text style={styles.sectionDescription}>{error}</Text>
              </View>
            </View>
          }
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
