setwd("~/Documents/UNC/SCOTUS-NLP/law-net")
library(jsonlite)
library(tidyjson)
library(rjson)
library(igraph)
full = read.csv("SCDB_2016_01_justiceCentered_Vote.csv")  #original data
#jdb = read.csv("JusticeParty.csv")  #table of justices and party association, no justice id
db = read.csv("scotusdb.csv")
J_party_final = read.csv(file = "JusticeData.csv")  #justices and the party they're assoc with 

#merge vote results with justices' appointment 
db1 = merge(full,jdb,by.x = 'justiceName', by.y = 'justiceName')  
#write.csv(db1, "SCOTUSPartyTagged.csv", sep = ",")
#justice party info with justice number 
J_party = cbind(db1["justiceName"],db1["justice"])  
J_party = unique(J_party)  #unique list of justice name and id

#merge justice id and party -- justice names/id, party associations - 5 vars
#J_party_final = merge(jdb, J_party,by.x = "justiceName", by.y = "justiceName")
#write.csv(J_party_final, "JusticeData.csv")
justices = unique(db["justiceName"])
#split camel case -don't use 
#strsplit(gsub("([A-Z])", " \\1", string.to.split), " ")
#timegroup = cut(db[,"term"],seq(from = 1946, to = 2015, by = 2))
#levels(timegroup)[as.integer(timegroup)]

############START FROM HERE to reformat/merge data cleaned from python scotus.py
J_party_final = read.csv(file = "JusticeData.csv")  #justices and the party they're assoc with 

data = fromJSON(file = "votedataG1.txt")  #each individual year -- need to look at vote id

#format data s.t C1, C2 are nodes, C3 is edge weight
#group numbers 
groups = {}  #keep track of how many groups there are 
Communities_Detected = list()  
d3 = {}
d3full = {}
for (i in 1:length(data)){
  print(i)
  results = list()
  matrix = cbind(data[[i]]$J1, data[[i]]$J2, data[[i]]$Vote)
  colnames(matrix) = c("J1","J2", "freq")
  m1 = merge(matrix, J_party_final, by.x = "J1", by.y = "justice")  #merge justice info for 1st justice
  m2 = merge(m1, J_party_final, by.x = "J2", by.y = "justice")  #merge 2nd justice info
  colnames(m2)[4:7] = c("J1name", "J1Prez", "J1PrezParty", "J1party")
  colnames(m2)[8:11] = c("J2name", "J2Prez", "J2PrezParty", "J2party")
  m2["Year"] = data[[i]]$Year
  membership = detect_community(matrix)
  judges = unique(c(matrix[,1], matrix[,2]))
  year = data[[i]]$Year
  num_groups = length(unique(membership$community))
  results["num_groups"] = num_groups
  results[["communities"]] = membership$community  #membership$community is a list, so use [[]]? 
  comm = membership$community
  results["mod"] = membership$modularity
  results["year"] = year
  Jnames = membership$names
  justice_grouping = cbind(as.numeric(Jnames),as.numeric(comm))
  colnames(justice_grouping) = c("Justice", "Group")
  
  #names of ppl in each group if indiv groups
  for (j in 1:length(membership$membernames)){
    groupname = paste("G",j, sep="")
    results[groupname] = membership$membernames[j]    
  }
  
  #merge group results with freq data 
  d3data = merge(m2, justice_grouping, by.x = "J1", by.y = "Justice")
  d3data2 = merge(d3data, justice_grouping, by.x = "J2", by.y = "Justice")  #with groups for J2
  d3data2["J_id"] = paste(d3data2[['J1']], d3data2[['J2']], sep ="_")
  d3 = rbind(d3,d3data)
  d3full = rbind(d3full,d3data2)  #with groups for J2
  Communities_Detected[[i]] = results
}
colnames(d3full)[13:14] = c("G1", "G2")
#write.csv(d3, file = "dataforD3.csv")
write.csv(d3full, file = "dataforD3Full.csv")
##add in total number times worked together but didn't vote together - april 11 
##merge from by case data
d3full = read.csv(file = "dataforD3Full.csv")
fulldata = read.csv(file= "D3_ByIssueFinal.csv")

d3full["YearJ_ID"] = paste(d3full[["J_id"]],d3full[["Year"]], sep="_")
fulldata["YearJ_ID"] = paste(fulldata[["J_id"]],fulldata[["Year"]], sep="_")
mergewith = cbind(fulldata["YearJ_ID"], fulldata["AllIssues_Case_Opps"])
ids = unique(mergewith[,1])  #unique list of YearJ_id
index = {}
for (i in 1:length(ids)){
  index = c(index, which(mergewith[,1] == ids[i])[1])
}
length(unique(mergewith[index,1])) == length(ids)  #sanity check -- should be true
mergewith = mergewith[index,]
finalagg = merge(d3full, mergewith, by.x = "YearJ_ID", by.y = "YearJ_ID", all.x = FALSE)
dim(finalagg)  #should match d3full 
#add color value 
d = finalagg
d["ColorValue"] = rep(0,dim(d)[1])
dems = intersect(which(d["J1PrezParty"] == "D"),which(d["J2PrezParty"] == "D"))
repubs = intersect(which(d["J1PrezParty"] == "R"),which(d["J2PrezParty"] == "R"))
d[dems, "ColorValue"] = 1
d[repubs, "ColorValue"] = -1
names(d)[names(d) == 'freq'] <- "Total_Freq"
names(d)[names(d) == 'AllIssues_Case_Opps'] <- "Case_Opps"
write.csv(d, file = 'dataforD3Full_WITH_TOTAL_OPPS.csv')

#get number of communities detected 
communities = rep(0,length(Communities_Detected))
mod = rep(0,length(Communities_Detected))
for (i in 1:length(Communities_Detected)){
  communities[i] = Communities_Detected[[i]]$num_groups  
  mod[i] = Communities_Detected[[i]]$mod  
}
comm_TS = ts(communities, start = 1946)
mod_TS = ts(mod, start = 1946)
lines(comm_TS)
plot(mod_TS)  #looks random af lol 
plot(mod, Dcount)
#all modularities are < 0 -- why are some 1 comm, but higher mod than others with 2
plot(mod,communities) 

table(communities,Dcount)
network = graph_from_data_frame(data, directed = FALSE)

####################
#function with all steps to get groups 
detect_community = function (matrix){
  toynet = graph_from_data_frame(matrix, directed = FALSE)
  edgeList <- get.edgelist(toynet)  #get edgelist 
  G <- graph.edgelist(edgeList, directed = FALSE)
  weight = matrix[,3]
  E(G)$weight <- weight  #add column to data frame
  A_weighted = as_adjacency_matrix(G, attr = "weight") #weighted adjacency matrix
  # find communities
  Gcomms <- cluster_fast_greedy(G)
  JusticeGroup = {}  #justices in groups --get justice ids in each groups
  for(j in 1:length(Gcomms)){
    #JGroup = {}  #holder for group 
    #for(k in 1:length(Gcomms[[j]])){
    #  JGroup = c(JGroup, Gcomms[[j]][k])
    #}
    groupnum = assign(paste(j),j)
    #JusticeGroup[[groupnum]] = JGroup  #final list of justices by group 
    JusticeGroup[[groupnum]] = Gcomms[[j]]  #final list of justices by group 
  }
  # show communities
  community = Gcomms$membership
  #attributes(Gcomms)
  modularity = sum(Gcomms$modularity)  
  JNames = Gcomms$names
  results = list("community" = community, "modularity" = modularity, "membernames" = JusticeGroup, "names" = JNames)
  return (results)
}


####################
#how often justices from diff parties vote together 
Dems = intersect(which(m2["J1PrezParty"] == "D"),which(m2["J2PrezParty"] == "D"))
Repubs = intersect(which(m2["J1PrezParty"] == "R"),which(m2["J2PrezParty"] == "R"))
mix1 = intersect(which(m2["J1PrezParty"] == "R"),which(m2["J2PrezParty"] == "D"))
mix2 = intersect(which(m2["J1PrezParty"] == "D"),which(m2["J2PrezParty"] == "R"))
mix = c(mix1, mix2)
m2

#not working - why as.data.frame(table(m2["J1PrezParty"], m2["J2PrezParty"]))
####################
# make example graph
#random graph with each connection having 50% probability
toynet <- erdos.renyi.game(100, p = 0.5)

# get the adjacency matrix
AdjMat <- get.adjacency(toynet)

# getting the edge matrix
edgeList <- get.edgelist(toynet)
dim(edgeList)

# re-making graph
G <- graph.edgelist(edgeList, directed = FALSE)

# make random weights
#weight <- rexp(nrow(edgeList))
weight = matrix[,3]
E(G)$weight <- weight  #add column to data frame

# show degrees
degree(G)

# show strength
strength(G)

# find communities
Gcomms <- cluster_fast_greedy(G)

# show communities
Gcomms$membership
sum(Gcomms$modularity)
