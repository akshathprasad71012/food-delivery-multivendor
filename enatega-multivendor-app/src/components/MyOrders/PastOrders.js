import React, { useContext, useState } from 'react'
import { View, TouchableOpacity, Image, FlatList } from 'react-native'
import { useSubscription } from '@apollo/client'
import gql from 'graphql-tag'
import { subscriptionOrder } from '../../apollo/subscriptions'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme } from '../../utils/themeColors'
import TextDefault from '../Text/TextDefault/TextDefault'
import TextError from '../Text/TextError/TextError'
import { alignment } from '../../utils/alignment'
import styles from './styles'
import SearchFood from '../../assets/SVG/imageComponents/SearchFood'
import Spinner from '../../components/Spinner/Spinner'
import OrdersContext from '../../context/Orders'
import { useTranslation } from 'react-i18next'
import ConfigurationContext from '../../context/Configuration'
import StarIcon from '../../../src/assets/SVG/imageComponents/starIcon'

function emptyView() {
  const orderStatusActive = ['PENDING', 'PICKED', 'ACCEPTED', 'ASSIGNED']
  const orderStatusInactive = ['DELIVERED', 'COMPLETED']
  const { orders, loadingOrders, errorOrders } = useContext(OrdersContext)
  if (loadingOrders) return <Spinner visible={loadingOrders} />
  if (errorOrders) return <TextError text={errorOrders.message} />
  else {
    const hasActiveOrders =
      orders.filter(o => orderStatusActive.includes(o.orderStatus)).length > 0

    const hasPastOrders =
      orders.filter(o => orderStatusInactive.includes(o.orderStatus)).length > 0
    if (hasActiveOrders || hasPastOrders) return null
    return (
      <View style={styles().subContainerImage}>
        <View style={styles().imageContainer}>
          <SearchFood width={scale(300)} height={scale(300)} />
        </View>
        <View style={styles().descriptionEmpty}>
          <TextDefault
            style={{ ...alignment.MBlarge }}
            textColor={currentTheme.fontMainColor}
            bolder
            center
            H2>
            {t('unReadOrders')}
          </TextDefault>
          <TextDefault
            textColor={currentTheme.fontMainColor}
            bold
            center
            H5
            style={{ ...alignment.MBxLarge }}>
            {t('dontHaveAnyOrderYet')}
          </TextDefault>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles(currentTheme).emptyButton}
          onPress={() =>
            props.navigation.navigate({
              name: 'Main',
              merge: true
            })
          }>
          <TextDefault
            style={{ ...alignment.Psmall }}
            textColor={currentTheme.fontMainColor}
            bolder
            B700
            center
            uppercase>
            {t('BrowseRESTAURANTS')}
          </TextDefault>
        </TouchableOpacity>
      </View>
    )
  }
}

const PastOrders = ({ navigation, loading, error, pastOrders }) => {
  const { t } = useTranslation()
  const themeContext = useContext(ThemeContext)
  const currentTheme = theme[themeContext.ThemeValue]
  const configuration = useContext(ConfigurationContext)
  const {
    reFetchOrders,
    fetchMoreOrdersFunc,
    networkStatusOrders
  } = useContext(OrdersContext)

  const renderItem = ({ item }) => (
    <Item
      item={item}
      navigation={navigation}
      currentTheme={currentTheme}
      configuration={configuration}
    />
  )

  if (loading) {
    return <></>
  }
  if (error) return <TextError text={error.message} />

  return (
    <FlatList
      data={pastOrders}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      ListEmptyComponent={emptyView()}
      refreshing={networkStatusOrders === 4}
      onRefresh={() => networkStatusOrders === 7 && reFetchOrders()}
      onEndReached={fetchMoreOrdersFunc}
    />
  )
}

const formatDeliveredAt = deliveredAt => {
  // Convert deliveredAt string to a Date object
  const deliveryDate = new Date(deliveredAt)

  // Define months array for formatting
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  // Getting components of the date
  const day = deliveryDate.getDate()
  const month = months[deliveryDate.getMonth()]
  const hours = deliveryDate.getHours()
  const minutes = deliveryDate.getMinutes()

  // Padding single digits with 0
  const formattedDay = day < 10 ? '0' + day : day
  const formattedHours = hours < 10 ? '0' + hours : hours
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes

  // Formatting the date and time
  return `${formattedDay} ${month} ${formattedHours}:${formattedMinutes}`
}
const getItems = items => {
  return items
    .map(
      item =>
        `${item.quantity}x ${item.title}${
          item.variation.title ? `(${item.variation.title})` : ''
        }`
    )
    .join('\n')
}

const Item = ({ item, navigation, currentTheme, configuration }) => {
  useSubscription(
    gql`
      ${subscriptionOrder}
    `,
    { variables: { id: item._id } }
  )
  const [rating, setRating] = useState(0)
  const handleRating = index => {
    setRating(index)
  }
  const { t } = useTranslation()

  return (
    <View style={{ ...alignment.MBsmall }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('OrderDetail', {
            _id: item._id,
            currencySymbol: configuration.currencySymbol,
            restaurant: item.restaurant,
            user: item.user
          })
        }>
        <View style={styles(currentTheme).subContainer}>
          <View
            style={{
              flexDirection: 'row'
            }}>
            <Image
              style={styles(currentTheme).restaurantImage}
              resizeMode="cover"
              source={{ uri: item.restaurant.image }}
            />
            <View style={styles(currentTheme).textContainer2}>
              <View style={{ flexDirection: 'row' }}>
                <View style={styles().subContainerLeft}>
                  <TextDefault
                    textColor={currentTheme.fontMainColor}
                    uppercase
                    bolder
                    numberOfLines={2}
                    style={styles(currentTheme).restaurantName}>
                    {item.restaurant.name}
                  </TextDefault>
                </View>
                <View style={styles(currentTheme).subContainerRight}>
                  <TextDefault textColor={currentTheme.fontMainColor} bolder>
                    {configuration.currencySymbol}
                    {parseFloat(item.orderAmount).toFixed(2)}
                  </TextDefault>
                </View>
              </View>
              <View>
                <TextDefault
                  numberOfLines={1}
                  style={{
                    ...alignment.MTxSmall,
                    width: '122%',
                  }}
                  textColor={currentTheme.fontSecondColor}
                  small>
                  {t('deliveredOn')} {formatDeliveredAt(item.deliveredAt)}
                </TextDefault>
                <TextDefault
                  numberOfLines={1}
                  style={{ ...alignment.MTxSmall }}
                  textColor={currentTheme.fontMainColor}
                  bolder
                  small>
                  {getItems(item.items)}
                </TextDefault>
              </View>
            </View>
          </View>
          <View style={styles().rateOrderContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles(currentTheme).subContainerButton}
              onPress={() => navigation.navigate('Reorder', { item })}>
              <TextDefault textColor={currentTheme.black} H4 bolder B700 center>
                {' '}
                {t('reOrder')}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <View style={styles(currentTheme).starsContainer}>
            <View style={{ flex: 3 }}>
              <TextDefault H4 bolder>
                {t('tapToRate')}
              </TextDefault>
            </View>
            <View style={{ flex: 5 }}>
              <TouchableOpacity style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map(index => (
                  <StarIcon
                    isFilled={index <= rating}
                    onPress={() => handleRating(index)}
                  />
                ))}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default PastOrders
