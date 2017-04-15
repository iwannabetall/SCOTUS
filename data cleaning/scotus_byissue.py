import pandas as pd 
import numpy as np
import os
import json 

# origdata = pd.read_csv("SCDB_2016_01_justiceCentered_Vote.csv", sep=",")
origdata = pd.read_csv("SCOTUSPartyTagged.csv", sep = ',')  #tagged with justice info 
def main():	
	years = range(1946,2016) 
	# #years = range(1946,2016,2) #2 years grouped
	# years = range(1946,2016,3) #2 years grouped
	# years = range(1946,2016,5) #2 years grouped
	vote_history = []
	keep = []  #indicator for if last value of docket id is 1
	voteid = []
	for i in range(len(origdata['docketId'])):
		docket_id_list = origdata['docketId'][i].split("-")
		vote_id_list = origdata['voteId'][i].split("-")
		del vote_id_list[-1]  #last id is justice id, 2nd to last is the vote issue within the case issue 
		newvoteid = "-".join(vote_id_list)  
		voteid.append(newvoteid)
		if (docket_id_list[len(docket_id_list)-1] == '01'):
			if (not np.isnan(origdata["vote"][i])):
				keep.append(1)
			else:
				keep.append(0)
		else:
			keep.append(0)
	origdata["keep"] = keep  #append colm to df
	origdata["newvoteid"] = newvoteid

	data = origdata.loc[origdata['keep'] == 1]  #data with only docket 01

	#change NA issue topics to 15 -- 15 = NA 	
	data.ix[data["issueArea"].isnull(), "issueArea"] = 15

	for year in years:
		vote_record = {}  #dictionary of history 
		#get only docket ids that end with 01 to minimize consolidation and reduce size of data
		justices_voted = []  #keep track of which justice voted 
		justices = data.loc[(data["term"] == year)]["justice"]  #one year
		#justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1))]["justice"]  #select just the justices in that year 
		#justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2))]["justice"]  #select just the justices in that year 
		# justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2)) | (data["term"] == (year + 3)) | (data["term"] == (year + 4))]["justice"]  #select just the justices in that year 
		justicelist = list(set(justices))  #unique list of justices 
		justicelist.sort()  #put justice id numbers in increasing order
		#casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		casesissues = data.loc[data["term"] == year]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		#casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		# casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2)) | (data["term"] == (year + 3)) | (data["term"] == (year + 4))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		caselist = list(set(casesissues))
		caselist.sort()
		J_first_colm = []
		J_second_colm = []
		J_pair = []   #concatenated justice IDs 
		same_vote = []  #number of times voted together
		majority_count = [] #number of times pair voted with majority 
		dissent_count = [] #number of times pair voted with majority 
		issue_id = range(1,16)   #data ranges from 1-14, added a 15 for NAs 
		worked_together_freq = []
		worked_same_case = [] ##list of arrays (caseissuesworked) -- number of times judge pair worked together on a case issue 
		voted_same_case = [] ##list of arrays -- number of times judge pair voted together on a case issue 
		# caseissuesworked = [] #array of length = # issues, counts number of times pair worked on a case issue
		# caseissues_samevote = 14*[0] #array of length = # issues, counts number of times pair voted same way on a case issue

		#make matrix of every combination of justices for each year --4 columns,ID of justice pair, justice 1, J2, number of times voted together
		for i in range(len(justicelist)):
			J1 = justicelist[i]
			for j in range(len(justicelist)):
				if J1 < justicelist[j]:
					J_pair.append(str(J1) + "_" + str(justicelist[j]))
					J_first_colm.append(J1)
					J_second_colm.append(justicelist[j])
					same_vote.append(0)
					worked_together_freq.append(0)
					majority_count.append(0)
					dissent_count.append(0)
					worked_same_case.append([])  #create lists of lists 
					voted_same_case.append([])  #each combination (ie J_pair) gets a list for case issue worked
		
		#fill list of lists with zeros for case issues 
		for k in range(len(worked_same_case)):
			worked_same_case[k] = 15 * [0]  #fill each list with 0s 
			voted_same_case[k] = 15 * [0]

		#pull casesissues data and calculate number of times voted together
		for caseissue in caselist:
			#find the (2) groups of justices who voted a certain way 
			case_data = data.loc[data["caseIssuesId"] == caseissue]  #all data for an individual case
			#find vote ids (might vote on 2 issues in larger issue)
			allvoteids = list(set(case_data["newvoteid"]))
			for casevoteid in allvoteids:
				casedatabyvoteid = case_data.loc[case_data["newvoteid"] == casevoteid]
				# print caseissue
				caseissuearea  = int(case_data["issueArea"].iloc[0])  #get first value of case issue area
				majority = list(set(casedatabyvoteid.loc[(case_data["vote"] <= 5) & (casedatabyvoteid["vote"] != 2)]["justice"]))  #justices who voted with majority, ie vote = 1, 3, 4 
				majority.sort()  
				dissent = list(set(casedatabyvoteid.loc[((case_data["vote"] == 2) | (casedatabyvoteid["vote"] == 6) | (casedatabyvoteid["vote"] == 7))]["justice"]))
				dissent.sort()
				#track if leaned liberal or conservative
				justices_on_case = list(set(case_data["justice"]))   #sorted unique list of justices on a case 
				# same_vote = vote_counter(majority, same_vote, J_pair, worked_same_case, voted_same_case, caseissuearea)  #tally pairs of those who voted together 
				same_vote, worked_same_case, voted_same_case, worked_together_freq = vote_counter(justices_on_case, majority, dissent, same_vote, J_pair, worked_same_case, voted_same_case, caseissuearea, worked_together_freq)
				# issuecounter(justices_on_case, J_pair, worked_same_case, voted_same_case, caseissuearea)
				#data quality check on majority votes
		vote_record.update({"Year": year, "id": J_pair ,"J1": J_first_colm, "J2" : J_second_colm, "Vote": same_vote, "Coworkers": worked_together_freq, "Coworkers_Issue": worked_same_case, "IssueAgreement": voted_same_case})
		vote_history.append(vote_record)   #array of dictionaries 
	
	#encode to json 
	#jdata = json.dumps(vote_history)
	with open('votedataG1_byissue.txt', 'w') as outfile:
	    json.dump(vote_history, outfile)
	os.system('say "DunDunDun Donnne"')

	#***track freq of justices who voted on majority vs. dissent vs split 
	#of those who voted together 


def vote_counter(justices_on_case, majority, dissent, same_vote, J_pair, worked_together, issue_voted_together, caseissuearea, worked_together_freq):
	for i in range(len(justices_on_case)):
		J1 = justices_on_case[i]
		for j in range(len(justices_on_case)):
			J2 = justices_on_case[j]
			if J1 < justices_on_case[j]:
				#count = same_vote[J_pair.index(str(J1) + "_" + str(majority[j]))]
				#check if voted together in majority or dissent
				pair_index = J_pair.index(str(J1) + "_" + str(justices_on_case[j]))
				if ((J1 in majority) and (J2 in majority)):
					same_vote[pair_index] += 1  #number of times pairs of justices voted together
					worked_together_freq[pair_index] += 1  #freq of working together
					##number times voted together on a particular issue 
					worked_together[pair_index][caseissuearea - 1] += 1  #worked on same case topic freq
					issue_voted_together[pair_index][caseissuearea - 1] += 1  #case issue area index needs minus 1 b/c 0 indexed
				elif ((J1 in dissent) and (J2 in dissent)):
					same_vote[pair_index] += 1  #number of times pairs of justices voted together
					worked_together_freq[pair_index] += 1  #freq of working together
					worked_together[pair_index][caseissuearea - 1] += 1  #worked on same case topic
					issue_voted_together[pair_index][caseissuearea - 1] += 1  #case issue area index needs minus 1 b/c 0 indexed
					##number times voted together on a particular issue 
				else: ##did not vote together 
					worked_together[pair_index][caseissuearea - 1] += 1  #worked on same case topic freq
					worked_together_freq[pair_index] += 1  #freq of working together
				# print J_pair[pair_index] + " " + str(J1) + " " + str(justices_on_case[j])
	return same_vote, worked_together, issue_voted_together, worked_together_freq


if __name__ == '__main__':
	main()
