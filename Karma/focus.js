import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  Slider,
  DatePickerIOS,
  Picker,
  PickerIOS,
  Image,
  AlertIOS,
  TouchableOpacity,
  Linking,
  ListView,
  AsyncStorage,
  Navigator,
  View
} from 'react-native';

import Dimensions from 'Dimensions';
import Form from 'react-native-form';
import Meteor, { createContainer } from 'react-native-meteor';
import Overlay from 'react-native-overlay';
import EStyleSheet from 'react-native-extended-stylesheet';

var styles = require('./styles');
var DOMParser = require('xmldom').DOMParser;

class Focus extends Component {

  constructor(props) {
    super(props);
    this.state = {loaded: false, videos: [], news: [], displayedVideos: [], displayedNews: []}
  }

  componentWillMount(){
    var rssFeeds = [
      "https://www.wired.com/feed/",
      // "http://www.theverge.com/culture/rss/index.xml",
      // "http://www.gq.com/style/rss",
      // "http://fivethirtyeight.com/all/feed",
      // "http://www.artnews.com/feed/",
      // "http://www.popsci.com/rss.xml",
      // "http://www.economist.com/sections/economics/rss.xml",
    ]
    var rssAuthors = [
      "Wired", "The Verge", "GQ", "FiveThirtyEight", "Art News", "Pop Sci", "Economist"
    ]
    var ytListIDs = [
      "PLJ8cMiYb3G5cX8x8hoIcd8NhMin3hqxzf",
      "PLwq1lYlgzlfrCEHl5bnm-24ho7o0YnLRj",
    ]
    for (let i = 0; i < rssFeeds.length; i++){
      this.fetchContent(rssFeeds[i], 'news', rssAuthors[i]);
    }
    for (let i = 0; i < ytListIDs.length; i++){
      var ytURL = "https://www.youtube.com/feeds/videos.xml" +
        "?playlist_id=" + ytListIDs[i];
      this.fetchContent(ytURL, 'video', "Youtube");
    }
    this.state.loaded = true;
  }

  parseVideo(s) {
    console.log('Parsing the feed...');
    var doc = new DOMParser().parseFromString(s, 'text/xml');
    var objs = [];
    var entries = doc.getElementsByTagName('entry');
    var videos = doc.getElementsByTagName('yt:videoId');
    var thumbs = doc.getElementsByTagName('media:thumbnail');
    for (var i=0; i < videos.length; i++) {
      objs.push({
        id: videos[i].textContent,
        thumbnail: thumbs[i].getAttribute('url'),
        title: entries[i].getElementsByTagName('title')[0].textContent
      })
    }
    var combined = this.state.videos.concat(objs);
    this.setState({videos: combined});
  }

  parseNews(s, author) {
    console.log('Parsing the feed...');
    var doc = new DOMParser().parseFromString(s, 'text/xml');
    var objs = [];
    var items = doc.getElementsByTagName('item');
    for (var i=0; i < items.length; i++) {
      try{
        // let author = items[i].getElementsByTagName('author')[0].textContent;
        let headline = items[i].getElementsByTagName('title')[0].textContent;
        let description = items[i].getElementsByTagName('description');
        let date = items[i].getElementsByTagName('pubDate')[0].textContent;
        let link = items[i].getElementsByTagName('link')[0].textContent;
        // alert(description[0].textContent);
        let parseDesc = this.parseDescription(description[0].textContent, author);
        let parseDate = this.parseDate(date);
        console.log(objs.length)
        objs.push({
          author: author,
          headline: headline,
          description: parseDesc[0],
          thumbnail: parseDesc[1],
          date: parseDate,
          link: link
        });
      } catch (error){
        continue
      }
    }
    this.setState({news: objs});
    // var current = this.state.news
    // if (current.length == 0){
    //
    //   this.setState({news: objs});    } else {
    //   this.setState({news: current.concat(objs)});
    // }
  }

  parseDate(fullDate){
    let dateRegex = /..*(?=..:)/;
    let date = dateRegex.exec(fullDate);
    let dateString = date[0].substring(0, date[0].length-3);
    return dateString;
  }


  parseDescription(description, author){
        // let thumbRegex = /(?:^|\s)<\/div>(.*?)The post(?:\s|$)/;
        if(author == "Wired"){
          let descRegex = /(<\/div>)(.*)(?=The post)/;
          let desc = descRegex.exec(description);
          let newDesc = desc[0].substring(6, desc[0].length-1);
          let thumbRegex = /(rss_thumbnail"><img)(.*)(?= alt=")/;
          let thum = thumbRegex.exec(description);
          let thumb = thum[0].substring(25, thum[0].length-1);
          return [newDesc, thumb];
        }
  }

  fetchContent(url, type, author) {
    console.log('Fetching content...');
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        if (type == 'news'){
          this.parseNews(responseText, author);
        } else if (type == 'video'){
          this.parseVideo(responseText);
        }
      })
      .catch((error) => {
        console.log('Error fetching the feed: ', error);
      });
  }

  constructVideo(video){
    return (
      <View style = {{height: 165, width: 0.8*Dimensions.get('window').width}}>
        <TouchableOpacity onPress={() => this.onPressVideo(video.id)}>
          <Image
            source={{uri: video.thumbnail}}
            style={{height: 165}}
            resizeMode={Image.resizeMode.cover}
          >
            <View style = {{flex: 1, backgroundColor: 'rgba(0,0,0,.3)'}}>
              <Text style={localStyleSheet.imageTitle}>{video.title}</Text>
            </View>
          </Image>
        </TouchableOpacity>
      </View>
    );
  }

  onPressVideo(videoID) {
    console.log('Pressed video: ', videoID);
      this.props.navigator.push({
        name: 'player',
        videoID: videoID,
        index: 3
    });
  }

  constructArticle(article){
    let organization = article.author;
    let headline = article.headline;
    let description = article.description;
    let date = article.date;
    let thumbnail = article.thumbnail;
    let padding = 5;
    let articleHeight = 150;
    let articleView =
      <TouchableOpacity style = {{alignSelf: 'center', alignItems: 'center',
                                width: 0.9*Dimensions.get('window').width,
                                height: articleHeight, backgroundColor: '#0000000'}} onPress={() => this.onPressArticle(article)}>
        <Image source={{uri: thumbnail}} style = {{width: 0.8*Dimensions.get('window').width, height: articleHeight}}>
          <View style = {{flex: 1, justifyContent:'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.3)'}}>
              <Text style = {localStyleSheet.organization}>{organization}</Text>
              <Text style = {localStyleSheet.headline}>{headline}</Text>
              <Text style = {localStyleSheet.description}>{description}</Text>
              <Text style = {localStyleSheet.date}>{date}</Text>
          </View>
        </Image>
        <View style = {{height: padding}}/>
      </TouchableOpacity>;
    return articleView;
  }

  onPressArticle(article){
    // <Text style = {localStyleSheet.description}>{thumbnail}</Text>
    // Thumbnail link here
  }

  getRows(numRows){
    let array = [];
    for (i = 0; i < numRows; i++){
      let contentType = Math.floor(Math.random()*5);
      if (contentType == 0 && this.state.videos.length){
        let randomVideo = this.state.videos[Math.floor(Math.random()*this.state.videos.length)];
        array.push(this.constructVideo(randomVideo));
      } else if (this.state.news.length) {
        let randomArticle = this.state.news[Math.floor(Math.random()*this.state.news.length)]
        // alert(this.state.news.length);
        let date = "19 November 2016";
        array.push(this.constructArticle(randomArticle));
      } else {
        let randomArticle = {author: "Wired", headline: "headline", description: "description", date: "date"};
        array.push(this.constructArticle(randomArticle));
      }
    }
    return array;
  }

  render() {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 != r2});
    return (
      <View style = {{flex: 1, maxHeight: 0.9*Dimensions.get('window').height, maxWidth: 0.9*Dimensions.get('window').width}}>
          <ListView
            dataSource={ds.cloneWithRows(this.getRows(25))}
            renderRow={(rowData) => <View style={{alignSelf: 'center'}}>{rowData}</View>}
            renderSeparator={this.renderSeparator}
          />
      </View>
    );
  }

  renderSeparator(
    sectionID: number | string,
    rowID: number | string,
    adjacentRowHighlighted: boolean)
    {
    return (
      <View
        key={"SEP_" + sectionID + "_" + rowID}
        style = {[localStyleSheet.rowSeperator, adjacentRowHighlighted && localStyleSheet.rowSeperatorHighlighted]}
      />
    )
  }
}

const localStyleSheet = EStyleSheet.create({
  rowSeperator: {
    backgroundColor: 'rgba(0,0,0,0)',
    height: 20,
    marginLeft: 4,
  },
  rowSeperatorHighlighted: {
    opacity: 0.0,
  },
  organization: {
    color: 'lightgrey',
    fontSize: 14,
    fontFamily: 'Helvetica',
    fontWeight: 'normal',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    marginVertical: 3,
    marginTop: 2,
    marginBottom: 2,
  },
  headline: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0)',
    textAlign: 'center',
    marginBottom: 2,
  },
  description: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Helvetica',
    fontWeight: 'normal',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    marginLeft: 6,
    marginBottom: 2,
  },
  date: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Helvetica',
    fontWeight: 'normal',
    textAlign: 'left',
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 2,
  },
  imageTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    textAlign: 'center',
    top: 60
  },
});

export default createContainer(params => {
  let an = Meteor.subscribe('analysis');
  let al = Meteor.subscribe('allocation');
  let cl = Meteor.subscribe('cells');

  return {
    userId: Meteor.userId(),
    ready: an.ready() && cl.ready(),
    analysis: Meteor.collection('analysis').findOne({ userId: Meteor.userId() }),
    allocation: Meteor.collection('allocations').findOne({ userId: Meteor.userId() }),
    cells: Meteor.collection('cells'),
  };
}, Focus);
